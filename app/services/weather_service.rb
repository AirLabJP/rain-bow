class WeatherService
    include HTTParty
    
    def initialize(latitude, longitude)
      @latitude = latitude
      @longitude = longitude
      @api_key = ENV['OPEN_WEATHER_MAP_API_KEY'] || 'YOUR_API_KEY_HERE' # 本番環境では環境変数で管理すべき
    end
    
    # 現在の天気情報を取得
    def current_weather
      url = "https://api.openweathermap.org/data/2.5/weather?lat=#{@latitude}&lon=#{@longitude}&appid=#{@api_key}&units=metric"
      response = HTTParty.get(url)
      
      if response.success?
        parse_weather_data(response)
      else
        { error: "天気情報の取得に失敗しました: #{response.code}" }
      end
    end
    
    # 過去数時間の天気情報を取得（虹の条件判定に必要）
    def recent_weather_history
      # Open Weather Map APIの無料プランでは履歴データが制限されているため
      # 実際の実装では有料プランか別のAPIを検討する必要があります
      # 現在はダミーデータを返します
      [
        { time: 3.hours.ago, condition: 'clear' },
        { time: 2.hours.ago, condition: 'rain' },
        { time: 1.hour.ago, condition: 'clear' }
      ]
    end
    
    # 虹が出る条件を満たしているか判定
    def rainbow_possible?
      history = recent_weather_history
      current = current_weather
      
      # 条件1: 過去に晴れ→雨→晴れの順で天気が変化している
      weather_sequence = history.map { |w| w[:condition] }
      sequence_match = weather_sequence == ['clear', 'rain', 'clear']
      
      # 条件2: 現在晴れている
      current_sunny = current[:weather_main] == 'Clear'
      
      # 条件3: 太陽の角度が適切（朝か夕方）
      sun_angle_appropriate = sun_angle_appropriate?
      
      sequence_match && current_sunny && sun_angle_appropriate
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
    def sun_angle_appropriate?
      current_time = Time.now
      weather_data = current_weather
      
      return false if weather_data[:error]
      
      sunrise = weather_data[:sunrise]
      sunset = weather_data[:sunset]
      
      # 朝日の直後か、夕日の少し前の時間帯で、太陽の角度が低い時間帯
      morning_rainbow = current_time > sunrise && current_time < (sunrise + 3.hours)
      evening_rainbow = current_time > (sunset - 3.hours) && current_time < sunset
      
      morning_rainbow || evening_rainbow
    end
  end