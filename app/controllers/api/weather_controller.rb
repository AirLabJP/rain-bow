module Api
    class WeatherController < ApplicationController
      # クロスサイトリクエストフォージェリ対策をスキップ（APIなので）
      skip_before_action :verify_authenticity_token
      
      def check
        # リクエストから緯度と経度を取得
        latitude = params[:lat]
        longitude = params[:lon]
        
        # パラメータの検証
        unless latitude.present? && longitude.present?
          render json: { error: '緯度と経度が必要です' }, status: :bad_request
          return
        end
        
        # 天気サービスを初期化
        weather_service = WeatherService.new(latitude, longitude)
        
        # 現在の天気情報を取得
        current_weather = weather_service.current_weather
        
        # エラーチェック
        if current_weather[:error]
          render json: { error: current_weather[:error] }, status: :service_unavailable
          return
        end
        
        # 虹が出る可能性があるかチェック
        rainbow_possible = weather_service.rainbow_possible?
        
        # 結果を返す
        render json: {
          current_weather: current_weather,
          rainbow_possible: rainbow_possible,
          message: rainbow_possible ? "虹が出ている可能性があります！" : "現在、虹が出る条件ではありません。"
        }
      end
    end
  end