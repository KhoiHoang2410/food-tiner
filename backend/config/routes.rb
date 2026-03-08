Rails.application.routes.draw do
  devise_for :users, skip: :all
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      delete 'auth/logout', to: 'auth#logout'

      namespace :my do
        resource :restaurant, only: [:show, :create, :update]
      end
    end
  end
end
