class WeatherService
  include HTTParty
  
  def initialize(latitude, longitude)
    @latitude = latitude
    @longitude = longitude
    @api_key = ENV['OPEN_WEATHER_MAP_API_KEY']
    @current_weather_cache = nil
    @forecast_cache = nil
    
    raise 'OPEN_WEATHER_MAP_API_KEY が設定されていません' if @api_key.nil? || @api_key.empty?
  end
  
  # 現在の天気情報を取得（キャッシュ付き）
  def current_weather
    return @current_weather_cache if @current_weather_cache
    
    url = "https://api.openweathermap.org/data/2.5/weather?lat=#{@latitude}&lon=#{@longitude}&appid=#{@api_key}&units=metric&lang=ja"
    response = HTTParty.get(url)
    
    if response.success?
      @current_weather_cache = parse_weather_data(response)
    else
      { error: "天気情報の取得に失敗しました: #{response.code}" }
    end
  rescue StandardError => e
    { error: "天気情報の取得中にエラーが発生しました: #{e.message}" }
  end
  
  # 3時間ごとの5日間予報を取得（過去の天気パターンの代替として使用）
  def forecast_data
    return @forecast_cache if @forecast_cache
    
    url = "https://api.openweathermap.org/data/2.5/forecast?lat=#{@latitude}&lon=#{@longitude}&appid=#{@api_key}&units=metric&lang=ja"
    response = HTTParty.get(url)
    
    if response.success?
      data = response.parsed_response
      @forecast_cache = data['list'].map do |item|
        {
          time: Time.at(item['dt']),
          condition: item['weather'][0]['main'],
          description: item['weather'][0]['description'],
          temp: item['main']['temp'],
          rain: item['rain'] ? item['rain']['3h'] : 0
        }
      end
    else
      []
    end
  rescue StandardError => e
    Rails.logger.error("予報データの取得エラー: #{e.message}")
    []
  end
  
  # 虹が出る条件を満たしているか判定
  def rainbow_possible?
    current = current_weather
    return false if current[:error]
    
    # 条件1: 現在晴れているか、雨が止んだ直後
    current_clear = ['Clear', 'Clouds'].include?(current[:weather_main])
    return false unless current_clear
    
    # 条件2: 太陽の角度が適切（朝か夕方）
    return false unless sun_angle_appropriate?(current)
    
    # 条件3: 最近雨が降った可能性（湿度が高い、または予報で雨がある）
    recently_rained = current[:humidity] > 70 || check_recent_rain_from_forecast
    
    current_clear && recently_rained
  end
  
  private
  
  def parse_weather_data(response)
    data = response.parsed_response
    {
      temperature: data['main']['temp'],
      weather_main: data['weather'][0]['main'],
      weather_description: data['weather'][0]['description'],
      humidity: data['main']['humidity'],
      wind_speed: data['wind']['speed'],
      city_name: data['name'],
      country: data['sys']['country'],
      weather_icon: data['weather'][0]['icon'],
      sunrise: Time.at(data['sys']['sunrise']),
      sunset: Time.at(data['sys']['sunset'])
    }
  end
  
  # 太陽の角度が虹が見える条件に適しているか（西または東の空に太陽がある状態）
  def sun_angle_appropriate?(weather_data)
    current_time = Time.now
    sunrise = weather_data[:sunrise]
    sunset = weather_data[:sunset]
    
    # 朝日の後2時間、または夕日の前2時間の時間帯
    morning_rainbow = current_time > sunrise && current_time < (sunrise + 2.hours)
    evening_rainbow = current_time > (sunset - 2.hours) && current_time < sunset
    
    morning_rainbow || evening_rainbow
  end
  
  # 予報データから最近雨が降ったかチェック
  def check_recent_rain_from_forecast
    forecasts = forecast_data
    return false if forecasts.empty?
    
    # 直近6時間以内の予報で雨があるかチェック
    recent_forecasts = forecasts.select { |f| f[:time] < Time.now + 6.hours }
    recent_forecasts.any? { |f| f[:condition] == 'Rain' || f[:rain] > 0 }
  end
end
