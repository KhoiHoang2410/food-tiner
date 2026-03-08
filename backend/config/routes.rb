Rails.application.routes.draw do
  devise_for :users, skip: :all
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      delete 'auth/logout', to: 'auth#logout'

      resources :restaurants, only: [:index, :show]
      resources :swipes, only: [:create]

      namespace :my do
        resource :restaurant, only: [:show, :create, :update]
        resources :photos, only: [:create, :destroy]
        resources :specials, only: [:create, :destroy]
      end
    end
  end
end
