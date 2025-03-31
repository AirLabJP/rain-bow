Rails.application.routes.draw do
  root to: 'layouts#index'
  
  namespace :api do
    get '/weather', to: 'weather#check'
  end

  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
end