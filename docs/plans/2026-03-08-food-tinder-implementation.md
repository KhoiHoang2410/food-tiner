# Food Tinder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Tinder-like mobile app for discovering and reserving restaurants, with a Rails API backend and React Native frontend.

**Architecture:** Single Rails API monolith (API mode) serves a React Native app with two roles: diner (swipe + reserve) and restaurant_owner (profile + reservation management). PostgreSQL for data, ActiveStorage + S3 for images, Devise + JWT for auth.

**Tech Stack:** Ruby on Rails 7 (API mode), PostgreSQL, ActiveStorage, Devise + JWT, RSpec, Factory Bot | React Native (Expo), TypeScript (strict), TanStack Query, NativeWind, Storybook, Jest + RNTL

**Design doc:** `docs/plans/2026-03-08-food-tinder-design.md`

---

## BACKEND

---

### Task 1: Rails API Project Setup

**Files:**
- Create: `backend/` (Rails app root)

**Step 1: Generate Rails API app**

```bash
rails new backend --api --database=postgresql -T
cd backend
```

**Step 2: Add gems to Gemfile**

```ruby
# Gemfile
gem 'devise'
gem 'devise-jwt'
gem 'rack-cors'
gem 'image_processing', '~> 1.2'

group :development, :test do
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'shoulda-matchers'
  gem 'database_cleaner-active_record'
end
```

**Step 3: Install and setup**

```bash
bundle install
rails db:create
rails generate rspec:install
```

**Step 4: Configure RSpec (`spec/rails_helper.rb`)**

```ruby
require 'database_cleaner/active_record'

RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods

  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning { example.run }
  end
end

Shoulda::Matchers.configure do |config|
  config.integrate { |with| with.test_framework(:rspec).and.library(:rails) }
end
```

**Step 5: Configure CORS (`config/initializers/cors.rb`)**

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    resource '*', headers: :any, methods: [:get, :post, :patch, :delete, :options]
  end
end
```

**Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Rails API project"
```

---

### Task 2: Standard Error Response

**Files:**
- Create: `backend/app/lib/food_tinder_error.rb`
- Create: `backend/app/controllers/api/v1/base_controller.rb`

**Step 1: Write failing test**

```bash
# spec/requests/api/v1/auth_spec.rb (create minimal file)
```

```ruby
# spec/lib/food_tinder_error_spec.rb
require 'rails_helper'

RSpec.describe FoodTinderError do
  it 'has error code and message' do
    error = FoodTinderError.new('TF1001', 'Missing or invalid token')
    expect(error.code).to eq('TF1001')
    expect(error.message).to eq('Missing or invalid token')
  end
end
```

**Step 2: Run test to verify it fails**

```bash
cd backend && bundle exec rspec spec/lib/food_tinder_error_spec.rb
```
Expected: FAIL — uninitialized constant FoodTinderError

**Step 3: Create error class**

```ruby
# app/lib/food_tinder_error.rb
class FoodTinderError < StandardError
  CODES = {
    # Auth
    TF1001: { status: 401, message: 'Missing or invalid token' },
    TF1002: { status: 401, message: 'Token expired' },
    TF1003: { status: 400, message: 'Invalid credentials' },
    TF1004: { status: 422, message: 'Email already registered' },
    TF1005: { status: 400, message: 'Invalid role' },
    # Authorization
    TF2001: { status: 400, message: 'Insufficient role for this action' },
    TF2002: { status: 400, message: 'Resource does not belong to current user' },
    # Restaurant
    TF3001: { status: 404, message: 'Restaurant not found' },
    TF3002: { status: 422, message: 'Restaurant already exists for this owner' },
    TF3003: { status: 422, message: 'Max photos limit reached (5)' },
    TF3004: { status: 422, message: 'Invalid image format or size' },
    # Reservation
    TF4001: { status: 404, message: 'Reservation not found' },
    TF4002: { status: 422, message: 'Pending reservation already exists for this restaurant' },
    TF4003: { status: 422, message: 'Cannot cancel a confirmed/rejected reservation' },
    # General
    TF5001: { status: 422, message: 'Validation failed' },
    TF5002: { status: 404, message: 'Resource not found' },
    TF5003: { status: 500, message: 'Internal server error' }
  }.freeze

  attr_reader :code, :http_status

  def initialize(code, message = nil)
    @code = code
    config = CODES[code.to_sym] || CODES[:TF5003]
    @http_status = config[:status]
    super(message || config[:message])
  end
end
```

**Step 4: Create base controller with error handling**

```ruby
# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate_user!

      rescue_from FoodTinderError do |e|
        render json: { errors: [{ message: e.message, error_code: e.code }] },
               status: e.http_status
      end

      rescue_from ActiveRecord::RecordNotFound do |_|
        render json: { errors: [{ message: 'Resource not found', error_code: 'TF5002' }] },
               status: 404
      end

      rescue_from ActiveRecord::RecordInvalid do |e|
        render json: { errors: [{ message: e.record.errors.full_messages.join(', '), error_code: 'TF5001' }] },
               status: 422
      end

      private

      def require_role!(role)
        raise FoodTinderError.new('TF2001') unless current_user.role == role.to_s
      end

      def current_user
        @current_user ||= warden.authenticate(scope: :user)
      end

      def authenticate_user!
        raise FoodTinderError.new('TF1001') unless current_user
      end
    end
  end
end
```

**Step 5: Configure autoload in `config/application.rb`**

```ruby
config.autoload_paths << Rails.root.join('app/lib')
```

**Step 6: Run test to verify it passes**

```bash
bundle exec rspec spec/lib/food_tinder_error_spec.rb
```
Expected: PASS

**Step 7: Commit**

```bash
git add app/lib/food_tinder_error.rb app/controllers/api/v1/base_controller.rb spec/lib/food_tinder_error_spec.rb
git commit -m "feat: add standardized error codes and base controller"
```

---

### Task 3: User Model + Auth (Devise + JWT)

**Files:**
- Create: `backend/app/models/user.rb`
- Create: `backend/app/controllers/api/v1/auth_controller.rb`
- Create: `backend/config/routes.rb` (modify)
- Create: `backend/spec/factories/users.rb`
- Create: `backend/spec/requests/api/v1/auth_spec.rb`

**Step 1: Generate Devise User**

```bash
rails generate devise:install
rails generate devise User
rails generate migration AddRoleToUsers role:integer
```

**Step 2: Write failing tests**

```ruby
# spec/requests/api/v1/auth_spec.rb
require 'rails_helper'

RSpec.describe 'Auth API', type: :request do
  describe 'POST /api/v1/auth/register' do
    it 'registers a diner' do
      post '/api/v1/auth/register', params: {
        email: 'test@example.com', password: 'password123', role: 'diner'
      }
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)['token']).to be_present
    end

    it 'returns TF1004 when email taken' do
      create(:user, email: 'test@example.com')
      post '/api/v1/auth/register', params: {
        email: 'test@example.com', password: 'password123', role: 'diner'
      }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF1004')
    end

    it 'returns TF1005 for invalid role' do
      post '/api/v1/auth/register', params: {
        email: 'test@example.com', password: 'password123', role: 'admin'
      }
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF1005')
    end
  end

  describe 'POST /api/v1/auth/login' do
    let!(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    it 'logs in with valid credentials' do
      post '/api/v1/auth/login', params: { email: 'test@example.com', password: 'password123' }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['token']).to be_present
    end

    it 'returns TF1003 for invalid credentials' do
      post '/api/v1/auth/login', params: { email: 'test@example.com', password: 'wrong' }
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF1003')
    end
  end
end
```

**Step 3: Run tests to verify they fail**

```bash
bundle exec rspec spec/requests/api/v1/auth_spec.rb
```
Expected: FAIL — routing errors

**Step 4: Setup User model**

```ruby
# app/models/user.rb
class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :jwt_authenticatable,
         jwt_revocation_strategy: JwtDenylist

  enum role: { diner: 0, restaurant_owner: 1 }

  validates :role, presence: true, inclusion: { in: roles.keys }
  validates :email, uniqueness: true
end
```

**Step 5: Generate JWT denylist and configure Devise JWT**

```bash
rails generate model JwtDenylist jti:string:index exp:datetime
rails db:migrate
```

```ruby
# app/models/jwt_denylist.rb
class JwtDenylist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Denylist
  self.table_name = 'jwt_denylists'
end
```

```ruby
# config/initializers/devise.rb (add inside Devise.setup block)
config.jwt do |jwt|
  jwt.secret = Rails.application.credentials.secret_key_base
  jwt.dispatch_requests = [['POST', %r{^/api/v1/auth/login$}]]
  jwt.revocation_requests = [['DELETE', %r{^/api/v1/auth/logout$}]]
  jwt.expiration_time = 24.hours.to_i
end
```

**Step 6: Create auth controller**

```ruby
# app/controllers/api/v1/auth_controller.rb
module Api
  module V1
    class AuthController < ActionController::API
      rescue_from FoodTinderError do |e|
        render json: { errors: [{ message: e.message, error_code: e.code }] },
               status: e.http_status
      end

      def register
        raise FoodTinderError.new('TF1005') unless User.roles.key?(params[:role])

        user = User.new(email: params[:email], password: params[:password], role: params[:role])
        raise FoodTinderError.new('TF1004') unless user.save

        token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
        render json: { token: token, user: { id: user.id, email: user.email, role: user.role } }, status: :created
      end

      def login
        user = User.find_by(email: params[:email])
        raise FoodTinderError.new('TF1003') unless user&.valid_password?(params[:password])

        token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
        render json: { token: token, user: { id: user.id, email: user.email, role: user.role } }
      end

      def logout
        render json: { message: 'Logged out' }
      end
    end
  end
end
```

**Step 7: Create factory**

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    password { 'password123' }
    role { :diner }

    trait :restaurant_owner do
      role { :restaurant_owner }
    end
  end
end
```

**Step 8: Configure routes**

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      delete 'auth/logout', to: 'auth#logout'
    end
  end
end
```

**Step 9: Run migration and tests**

```bash
rails db:migrate
bundle exec rspec spec/requests/api/v1/auth_spec.rb
```
Expected: PASS

**Step 10: Commit**

```bash
git add app/models/user.rb app/models/jwt_denylist.rb app/controllers/api/v1/auth_controller.rb config/routes.rb spec/factories/users.rb spec/requests/api/v1/auth_spec.rb db/migrate/
git commit -m "feat: add user auth with Devise JWT"
```

---

### Task 4: Restaurant Model + Owner Endpoints

**Files:**
- Create: `backend/db/migrate/..._create_restaurants.rb`
- Create: `backend/app/models/restaurant.rb`
- Create: `backend/app/controllers/api/v1/my/restaurants_controller.rb`
- Create: `backend/spec/factories/restaurants.rb`
- Create: `backend/spec/requests/api/v1/my/restaurants_spec.rb`

**Step 1: Generate migration**

```bash
rails generate model Restaurant owner_id:integer:index name:string description:text phone:string address:string latitude:decimal longitude:decimal cuisine_type:string price_range:integer opening_hours:jsonb is_active:boolean
rails db:migrate
```

**Step 2: Write failing tests**

```ruby
# spec/requests/api/v1/my/restaurants_spec.rb
require 'rails_helper'

RSpec.describe 'My Restaurant API', type: :request do
  let(:owner) { create(:user, :restaurant_owner) }
  let(:headers) { auth_headers(owner) }

  describe 'GET /api/v1/my/restaurant' do
    context 'when restaurant exists' do
      let!(:restaurant) { create(:restaurant, user: owner) }

      it 'returns the restaurant' do
        get '/api/v1/my/restaurant', headers: headers
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['name']).to eq(restaurant.name)
      end
    end

    it 'returns TF3001 when no restaurant' do
      get '/api/v1/my/restaurant', headers: headers
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF3001')
    end
  end

  describe 'POST /api/v1/my/restaurant' do
    it 'creates a restaurant' do
      post '/api/v1/my/restaurant', params: {
        name: 'Pho House', cuisine_type: 'Vietnamese', price_range: 2,
        phone: '0901234567', address: '123 Main St', latitude: 10.77, longitude: 106.69,
        opening_hours: { mon: '08:00-22:00' }
      }, headers: headers
      expect(response).to have_http_status(:created)
    end

    it 'returns TF3002 when restaurant already exists' do
      create(:restaurant, user: owner)
      post '/api/v1/my/restaurant', params: { name: 'Another' }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF3002')
    end
  end

  describe 'PATCH /api/v1/my/restaurant' do
    let!(:restaurant) { create(:restaurant, user: owner) }

    it 'updates the restaurant' do
      patch '/api/v1/my/restaurant', params: { name: 'New Name' }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['name']).to eq('New Name')
    end
  end

  describe 'role guard' do
    it 'returns TF2001 for diner role' do
      diner = create(:user)
      get '/api/v1/my/restaurant', headers: auth_headers(diner)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF2001')
    end
  end
end
```

**Step 3: Add auth helper to spec support**

```ruby
# spec/support/auth_helpers.rb
module AuthHelpers
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { 'Authorization' => "Bearer #{token}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
```

Add to `spec/rails_helper.rb`:
```ruby
Dir[Rails.root.join('spec/support/**/*.rb')].each { |f| require f }
```

**Step 4: Run tests to verify they fail**

```bash
bundle exec rspec spec/requests/api/v1/my/restaurants_spec.rb
```
Expected: FAIL

**Step 5: Create Restaurant model**

```ruby
# app/models/restaurant.rb
class Restaurant < ApplicationRecord
  belongs_to :user, foreign_key: :owner_id
  has_many_attached :photos
  has_many :specials, dependent: :destroy

  enum price_range: { budget: 1, moderate: 2, pricey: 3, luxury: 4 }

  validates :name, :phone, :address, :cuisine_type, :price_range, presence: true
  validates :latitude, :longitude, numericality: true, allow_nil: true
end
```

**Step 6: Create factory**

```ruby
# spec/factories/restaurants.rb
FactoryBot.define do
  factory :restaurant do
    association :user, factory: [:user, :restaurant_owner], foreign_key: :owner_id
    name { Faker::Restaurant.name }
    description { Faker::Lorem.paragraph }
    phone { Faker::PhoneNumber.cell_phone }
    address { Faker::Address.full_address }
    latitude { Faker::Address.latitude }
    longitude { Faker::Address.longitude }
    cuisine_type { 'Vietnamese' }
    price_range { 2 }
    is_active { true }
    opening_hours { { mon: '08:00-22:00' } }
  end
end
```

**Step 7: Create controller**

```ruby
# app/controllers/api/v1/my/restaurants_controller.rb
module Api
  module V1
    module My
      class RestaurantsController < Api::V1::BaseController
        before_action :require_owner!

        def show
          render json: restaurant_json(my_restaurant)
        end

        def create
          raise FoodTinderError.new('TF3002') if current_user.restaurant.present?

          restaurant = Restaurant.create!(restaurant_params.merge(owner_id: current_user.id))
          render json: restaurant_json(restaurant), status: :created
        end

        def update
          my_restaurant.update!(restaurant_params)
          render json: restaurant_json(my_restaurant)
        end

        private

        def my_restaurant
          @my_restaurant ||= Restaurant.find_by!(owner_id: current_user.id).tap do |r|
            raise FoodTinderError.new('TF3001') if r.nil?
          end
        rescue ActiveRecord::RecordNotFound
          raise FoodTinderError.new('TF3001')
        end

        def require_owner!
          require_role!(:restaurant_owner)
        end

        def restaurant_params
          params.permit(:name, :description, :phone, :address, :latitude, :longitude,
                        :cuisine_type, :price_range, :is_active, opening_hours: {})
        end

        def restaurant_json(restaurant)
          restaurant.as_json(except: [:owner_id]).merge(user_id: restaurant.owner_id)
        end
      end
    end
  end
end
```

**Step 8: Add User#restaurant association**

```ruby
# app/models/user.rb (add line)
has_one :restaurant, foreign_key: :owner_id
```

**Step 9: Add routes**

```ruby
# config/routes.rb (add inside api/v1 namespace)
namespace :my do
  resource :restaurant, only: [:show, :create, :update]
end
```

**Step 10: Run tests**

```bash
bundle exec rspec spec/requests/api/v1/my/restaurants_spec.rb
```
Expected: PASS

**Step 11: Commit**

```bash
git add app/models/restaurant.rb app/controllers/api/v1/my/ spec/requests/api/v1/my/ spec/factories/restaurants.rb spec/support/ db/migrate/
git commit -m "feat: add restaurant model and owner management endpoints"
```

---

### Task 5: Photo Upload

**Files:**
- Modify: `backend/app/controllers/api/v1/my/restaurants_controller.rb`
- Create: `backend/spec/requests/api/v1/my/photos_spec.rb`

**Step 1: Configure ActiveStorage**

```bash
rails active_storage:install
rails db:migrate
```

Configure S3 in `config/storage.yml` (already generated), set `config/environments/production.rb`:
```ruby
config.active_storage.service = :amazon
```

**Step 2: Write failing tests**

```ruby
# spec/requests/api/v1/my/photos_spec.rb
require 'rails_helper'

RSpec.describe 'Restaurant Photos', type: :request do
  let(:owner) { create(:user, :restaurant_owner) }
  let!(:restaurant) { create(:restaurant, user: owner) }
  let(:headers) { auth_headers(owner) }
  let(:photo) { fixture_file_upload('spec/fixtures/test.jpg', 'image/jpeg') }

  describe 'POST /api/v1/my/restaurant/photos' do
    it 'attaches a photo' do
      post '/api/v1/my/restaurant/photos', params: { photo: photo }, headers: headers
      expect(response).to have_http_status(:created)
      expect(restaurant.reload.photos.count).to eq(1)
    end

    it 'returns TF3003 when 5 photos already attached' do
      5.times { restaurant.photos.attach(io: File.open('spec/fixtures/test.jpg'), filename: 'test.jpg', content_type: 'image/jpeg') }
      post '/api/v1/my/restaurant/photos', params: { photo: photo }, headers: headers
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF3003')
    end
  end

  describe 'DELETE /api/v1/my/restaurant/photos/:id' do
    it 'removes a photo' do
      restaurant.photos.attach(io: File.open('spec/fixtures/test.jpg'), filename: 'test.jpg', content_type: 'image/jpeg')
      blob_id = restaurant.photos.first.id
      delete "/api/v1/my/restaurant/photos/#{blob_id}", headers: headers
      expect(response).to have_http_status(:no_content)
    end
  end
end
```

Add `spec/fixtures/test.jpg` — a small valid JPEG for testing.

**Step 3: Add photos controller**

```ruby
# app/controllers/api/v1/my/photos_controller.rb
module Api
  module V1
    module My
      class PhotosController < Api::V1::BaseController
        before_action :require_owner!

        def create
          raise FoodTinderError.new('TF3003') if restaurant.photos.count >= 5

          restaurant.photos.attach(params[:photo])
          render json: { message: 'Photo uploaded' }, status: :created
        end

        def destroy
          attachment = restaurant.photos.find(params[:id])
          attachment.purge
          head :no_content
        end

        private

        def restaurant
          @restaurant ||= Restaurant.find_by!(owner_id: current_user.id)
        rescue ActiveRecord::RecordNotFound
          raise FoodTinderError.new('TF3001')
        end

        def require_owner!
          require_role!(:restaurant_owner)
        end
      end
    end
  end
end
```

**Step 4: Add routes**

```ruby
# Inside namespace :my
resources :photos, only: [:create, :destroy], controller: 'my/photos'
```

**Step 5: Run tests**

```bash
bundle exec rspec spec/requests/api/v1/my/photos_spec.rb
```
Expected: PASS

**Step 6: Commit**

```bash
git add app/controllers/api/v1/my/photos_controller.rb spec/requests/api/v1/my/photos_spec.rb
git commit -m "feat: add restaurant photo upload"
```

---

### Task 6: Specials

**Files:**
- Create: `backend/app/models/special.rb`
- Create: `backend/app/controllers/api/v1/my/specials_controller.rb`
- Create: `backend/spec/factories/specials.rb`
- Create: `backend/spec/requests/api/v1/my/specials_spec.rb`

**Step 1: Generate model**

```bash
rails generate model Special restaurant:references title:string description:text valid_until:date
rails db:migrate
```

**Step 2: Write failing tests**

```ruby
# spec/requests/api/v1/my/specials_spec.rb
require 'rails_helper'

RSpec.describe 'Restaurant Specials', type: :request do
  let(:owner) { create(:user, :restaurant_owner) }
  let!(:restaurant) { create(:restaurant, user: owner) }
  let(:headers) { auth_headers(owner) }

  describe 'POST /api/v1/my/restaurant/specials' do
    it 'creates a special' do
      post '/api/v1/my/restaurant/specials', params: {
        title: 'Happy Hour', description: '50% off drinks', valid_until: 1.week.from_now.to_date
      }, headers: headers
      expect(response).to have_http_status(:created)
      expect(restaurant.reload.specials.count).to eq(1)
    end
  end

  describe 'DELETE /api/v1/my/restaurant/specials/:id' do
    let!(:special) { create(:special, restaurant: restaurant) }

    it 'deletes the special' do
      delete "/api/v1/my/restaurant/specials/#{special.id}", headers: headers
      expect(response).to have_http_status(:no_content)
    end
  end
end
```

**Step 3: Create model and factory**

```ruby
# app/models/special.rb
class Special < ApplicationRecord
  belongs_to :restaurant
  validates :title, presence: true
end
```

```ruby
# spec/factories/specials.rb
FactoryBot.define do
  factory :special do
    association :restaurant
    title { 'Happy Hour' }
    description { '50% off selected drinks' }
    valid_until { 1.week.from_now.to_date }
  end
end
```

**Step 4: Create controller**

```ruby
# app/controllers/api/v1/my/specials_controller.rb
module Api
  module V1
    module My
      class SpecialsController < Api::V1::BaseController
        before_action :require_owner!

        def create
          special = restaurant.specials.create!(special_params)
          render json: special, status: :created
        end

        def destroy
          restaurant.specials.find(params[:id]).destroy
          head :no_content
        end

        private

        def restaurant
          @restaurant ||= Restaurant.find_by!(owner_id: current_user.id)
        rescue ActiveRecord::RecordNotFound
          raise FoodTinderError.new('TF3001')
        end

        def require_owner!
          require_role!(:restaurant_owner)
        end

        def special_params
          params.permit(:title, :description, :valid_until)
        end
      end
    end
  end
end
```

**Step 5: Add routes**

```ruby
# Inside namespace :my, resource :restaurant block
resources :specials, only: [:create, :destroy], controller: 'my/specials'
```

**Step 6: Run tests**

```bash
bundle exec rspec spec/requests/api/v1/my/specials_spec.rb
```
Expected: PASS

**Step 7: Commit**

```bash
git add app/models/special.rb app/controllers/api/v1/my/specials_controller.rb spec/ db/migrate/
git commit -m "feat: add restaurant specials management"
```

---

### Task 7: Swipe Feed (Diner — Geo-filtered Restaurant List)

**Files:**
- Create: `backend/app/controllers/api/v1/restaurants_controller.rb`
- Create: `backend/spec/requests/api/v1/restaurants_spec.rb`

**Step 1: Add geo distance query support**

Add to Gemfile:
```ruby
gem 'geocoder'
```
```bash
bundle install
```

**Step 2: Write failing tests**

```ruby
# spec/requests/api/v1/restaurants_spec.rb
require 'rails_helper'

RSpec.describe 'Restaurants API', type: :request do
  let(:diner) { create(:user) }
  let(:headers) { auth_headers(diner) }

  describe 'GET /api/v1/restaurants' do
    let!(:nearby) { create(:restaurant, latitude: 10.77, longitude: 106.69, cuisine_type: 'Vietnamese', price_range: 2) }
    let!(:far_away) { create(:restaurant, latitude: 20.0, longitude: 100.0) }

    it 'returns restaurants within radius' do
      get '/api/v1/restaurants', params: { lat: 10.77, lng: 106.69, radius_km: 5 }, headers: headers
      names = JSON.parse(response.body).map { |r| r['name'] }
      expect(names).to include(nearby.name)
      expect(names).not_to include(far_away.name)
    end

    it 'filters by cuisine_type' do
      get '/api/v1/restaurants', params: {
        lat: 10.77, lng: 106.69, radius_km: 50, cuisine: 'Vietnamese'
      }, headers: headers
      expect(JSON.parse(response.body).all? { |r| r['cuisine_type'] == 'Vietnamese' }).to be true
    end
  end

  describe 'GET /api/v1/restaurants/:id' do
    let!(:restaurant) { create(:restaurant) }

    it 'returns restaurant detail' do
      get "/api/v1/restaurants/#{restaurant.id}", headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['id']).to eq(restaurant.id)
    end
  end
end
```

**Step 3: Create controller**

```ruby
# app/controllers/api/v1/restaurants_controller.rb
module Api
  module V1
    class RestaurantsController < Api::V1::BaseController
      before_action :require_diner!, only: [:index]

      def index
        restaurants = Restaurant.where(is_active: true)

        if params[:lat].present? && params[:lng].present?
          radius = (params[:radius_km] || 10).to_f
          restaurants = restaurants.near([params[:lat], params[:lng]], radius, units: :km)
        end

        restaurants = restaurants.where(cuisine_type: params[:cuisine]) if params[:cuisine].present?
        restaurants = restaurants.where(price_range: params[:price_range]) if params[:price_range].present?

        already_swiped = Swipe.where(user: current_user).pluck(:restaurant_id)
        restaurants = restaurants.where.not(id: already_swiped)

        render json: restaurants.page(params[:page]).per(10)
      end

      def show
        render json: Restaurant.find(params[:id])
      end

      private

      def require_diner!
        require_role!(:diner)
      end
    end
  end
end
```

**Step 4: Configure Geocoder**

```ruby
# config/initializers/geocoder.rb
Geocoder.configure(units: :km)
```

Add to `app/models/restaurant.rb`:
```ruby
geocoded_by :address
reverse_geocoded_by :latitude, :longitude
```

Add `kaminari` gem for pagination:
```ruby
gem 'kaminari'
```

**Step 5: Add routes**

```ruby
resources :restaurants, only: [:index, :show]
```

**Step 6: Run tests**

```bash
bundle exec rspec spec/requests/api/v1/restaurants_spec.rb
```
Expected: PASS

**Step 7: Commit**

```bash
git add app/controllers/api/v1/restaurants_controller.rb spec/requests/api/v1/restaurants_spec.rb
git commit -m "feat: add swipe feed with geo-filtering"
```

---

### Task 8: Swipes

**Files:**
- Create: `backend/app/models/swipe.rb`
- Create: `backend/app/controllers/api/v1/swipes_controller.rb`
- Create: `backend/spec/requests/api/v1/swipes_spec.rb`

**Step 1: Generate model**

```bash
rails generate model Swipe user:references restaurant:references direction:integer
rails db:migrate
```

**Step 2: Write failing tests**

```ruby
# spec/requests/api/v1/swipes_spec.rb
require 'rails_helper'

RSpec.describe 'Swipes API', type: :request do
  let(:diner) { create(:user) }
  let!(:restaurant) { create(:restaurant) }
  let(:headers) { auth_headers(diner) }

  describe 'POST /api/v1/swipes' do
    it 'records a right swipe' do
      post '/api/v1/swipes', params: { restaurant_id: restaurant.id, direction: 'right' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(Swipe.last.direction).to eq('right')
    end

    it 'upserts on duplicate swipe' do
      create(:swipe, user: diner, restaurant: restaurant, direction: :left)
      post '/api/v1/swipes', params: { restaurant_id: restaurant.id, direction: 'right' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(Swipe.where(user: diner, restaurant: restaurant).count).to eq(1)
      expect(Swipe.last.direction).to eq('right')
    end
  end
end
```

**Step 3: Create model**

```ruby
# app/models/swipe.rb
class Swipe < ApplicationRecord
  belongs_to :user
  belongs_to :restaurant
  enum direction: { left: 0, right: 1 }
  validates :direction, presence: true
end
```

**Step 4: Create factory**

```ruby
# spec/factories/swipes.rb
FactoryBot.define do
  factory :swipe do
    association :user
    association :restaurant
    direction { :right }
  end
end
```

**Step 5: Create controller**

```ruby
# app/controllers/api/v1/swipes_controller.rb
module Api
  module V1
    class SwipesController < Api::V1::BaseController
      def create
        swipe = Swipe.find_or_initialize_by(user: current_user, restaurant_id: params[:restaurant_id])
        swipe.direction = params[:direction]
        swipe.save!
        render json: swipe, status: :created
      end
    end
  end
end
```

**Step 6: Add routes**

```ruby
resources :swipes, only: [:create]
```

**Step 7: Run tests**

```bash
bundle exec rspec spec/requests/api/v1/swipes_spec.rb
```
Expected: PASS

**Step 8: Commit**

```bash
git add app/models/swipe.rb app/controllers/api/v1/swipes_controller.rb spec/
git commit -m "feat: add swipe recording with upsert"
```

---

### Task 9: Reservations

**Files:**
- Create: `backend/app/models/reservation.rb`
- Create: `backend/app/controllers/api/v1/reservations_controller.rb`
- Create: `backend/app/controllers/api/v1/my/reservations_controller.rb`
- Create: `backend/spec/requests/api/v1/reservations_spec.rb`

**Step 1: Generate model**

```bash
rails generate model Reservation user:references restaurant:references party_size:integer requested_at:datetime note:text status:integer
rails db:migrate
```

**Step 2: Write failing tests**

```ruby
# spec/requests/api/v1/reservations_spec.rb
require 'rails_helper'

RSpec.describe 'Reservations API', type: :request do
  let(:diner) { create(:user) }
  let(:owner) { create(:user, :restaurant_owner) }
  let!(:restaurant) { create(:restaurant, user: owner) }
  let(:diner_headers) { auth_headers(diner) }
  let(:owner_headers) { auth_headers(owner) }

  describe 'POST /api/v1/reservations (diner)' do
    it 'creates a pending reservation' do
      post '/api/v1/reservations', params: {
        restaurant_id: restaurant.id, party_size: 2,
        requested_at: 1.day.from_now.iso8601, note: 'Window seat please'
      }, headers: diner_headers
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)['status']).to eq('pending')
    end

    it 'returns TF4002 for duplicate pending reservation' do
      create(:reservation, user: diner, restaurant: restaurant, status: :pending)
      post '/api/v1/reservations', params: {
        restaurant_id: restaurant.id, party_size: 2, requested_at: 1.day.from_now.iso8601
      }, headers: diner_headers
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF4002')
    end
  end

  describe 'DELETE /api/v1/reservations/:id (diner cancel)' do
    let!(:reservation) { create(:reservation, user: diner, restaurant: restaurant, status: :pending) }

    it 'cancels a pending reservation' do
      delete "/api/v1/reservations/#{reservation.id}", headers: diner_headers
      expect(response).to have_http_status(:ok)
      expect(reservation.reload.status).to eq('cancelled')
    end

    it 'returns TF4003 for confirmed reservation' do
      reservation.update!(status: :confirmed)
      delete "/api/v1/reservations/#{reservation.id}", headers: diner_headers
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF4003')
    end
  end

  describe 'PATCH /api/v1/my/reservations/:id (owner)' do
    let!(:reservation) { create(:reservation, user: diner, restaurant: restaurant, status: :pending) }

    it 'confirms a reservation' do
      patch "/api/v1/my/reservations/#{reservation.id}", params: { status: 'confirmed' }, headers: owner_headers
      expect(response).to have_http_status(:ok)
      expect(reservation.reload.status).to eq('confirmed')
    end
  end
end
```

**Step 3: Create model**

```ruby
# app/models/reservation.rb
class Reservation < ApplicationRecord
  belongs_to :user
  belongs_to :restaurant
  enum status: { pending: 0, confirmed: 1, rejected: 2, cancelled: 3 }
  validates :party_size, :requested_at, :status, presence: true
end
```

**Step 4: Create factory**

```ruby
# spec/factories/reservations.rb
FactoryBot.define do
  factory :reservation do
    association :user
    association :restaurant
    party_size { 2 }
    requested_at { 1.day.from_now }
    status { :pending }
  end
end
```

**Step 5: Create diner reservations controller**

```ruby
# app/controllers/api/v1/reservations_controller.rb
module Api
  module V1
    class ReservationsController < Api::V1::BaseController
      def index
        render json: current_user.reservations.order(created_at: :desc)
      end

      def create
        existing = Reservation.find_by(user: current_user, restaurant_id: params[:restaurant_id], status: :pending)
        raise FoodTinderError.new('TF4002') if existing

        reservation = current_user.reservations.create!(reservation_params.merge(status: :pending))
        render json: reservation, status: :created
      end

      def destroy
        reservation = current_user.reservations.find(params[:id])
        raise FoodTinderError.new('TF4003') unless reservation.pending?

        reservation.update!(status: :cancelled)
        render json: reservation
      end

      private

      def reservation_params
        params.permit(:restaurant_id, :party_size, :requested_at, :note)
      end
    end
  end
end
```

**Step 6: Create owner reservations controller**

```ruby
# app/controllers/api/v1/my/reservations_controller.rb
module Api
  module V1
    module My
      class ReservationsController < Api::V1::BaseController
        before_action :require_owner!

        def index
          render json: my_restaurant.reservations.order(created_at: :desc)
        end

        def update
          reservation = my_restaurant.reservations.find(params[:id])
          reservation.update!(status: params[:status])
          render json: reservation
        end

        private

        def my_restaurant
          @my_restaurant ||= Restaurant.find_by!(owner_id: current_user.id)
        end

        def require_owner!
          require_role!(:restaurant_owner)
        end
      end
    end
  end
end
```

**Step 7: Add User#reservations**

```ruby
# app/models/user.rb (add)
has_many :reservations
```

**Step 8: Add routes**

```ruby
resources :reservations, only: [:index, :create, :destroy]

namespace :my do
  resources :reservations, only: [:index, :update], controller: 'my/reservations'
end
```

**Step 9: Run tests**

```bash
bundle exec rspec spec/requests/api/v1/reservations_spec.rb
```
Expected: PASS

**Step 10: Run full suite**

```bash
bundle exec rspec
```
Expected: All PASS

**Step 11: Commit**

```bash
git add app/models/reservation.rb app/controllers/api/v1/reservations_controller.rb app/controllers/api/v1/my/reservations_controller.rb spec/
git commit -m "feat: add reservation request and management endpoints"
```

---

## FRONTEND

---

### Task 10: React Native Project Setup

**Files:**
- Create: `mobile/` (Expo app root)

**Step 1: Create Expo project**

```bash
npx create-expo-app mobile --template blank-typescript
cd mobile
```

**Step 2: Install dependencies**

```bash
npx expo install expo-secure-store expo-image-picker
npm install @tanstack/react-query axios
npm install nativewind tailwindcss
npm install react-native-gesture-handler react-native-reanimated
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

**Step 3: Configure TypeScript strict mode**

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

**Step 4: Configure NativeWind**

```js
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: []
};
```

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["nativewind/babel", "react-native-reanimated/plugin"]
  };
};
```

**Step 5: Setup Storybook**

```bash
npx storybook@latest init --type react_native
```

**Step 6: Setup TanStack Query provider in `app/_layout.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
```

**Step 7: Create API client**

```typescript
// lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Step 8: Commit**

```bash
git add mobile/
git commit -m "feat: initialize React Native Expo project with TypeScript and NativeWind"
```

---

### Task 11: Auth Screens (Login + Register)

**Files:**
- Create: `mobile/app/(auth)/login.tsx`
- Create: `mobile/app/(auth)/register.tsx`
- Create: `mobile/hooks/useAuth.ts`
- Create: `mobile/components/auth/AuthForm.tsx`
- Create: `mobile/components/auth/AuthForm.stories.tsx`

**Step 1: Create auth hook**

```typescript
// hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';

interface AuthResponse {
  token: string;
  user: { id: number; email: string; role: string };
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync('auth_token', data.token);
      await SecureStore.setItemAsync('user_role', data.user.role);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; role: string }) => {
      const res = await api.post<AuthResponse>('/auth/register', data);
      return res.data;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync('auth_token', data.token);
      await SecureStore.setItemAsync('user_role', data.user.role);
    },
  });
}
```

**Step 2: Create Storybook story first**

```tsx
// components/auth/AuthForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import { AuthForm } from './AuthForm';

const meta: Meta<typeof AuthForm> = {
  title: 'Auth/AuthForm',
  component: AuthForm,
};
export default meta;

export const Login: StoryObj<typeof AuthForm> = {
  args: { mode: 'login', onSubmit: () => {}, isLoading: false },
};

export const Register: StoryObj<typeof AuthForm> = {
  args: { mode: 'register', onSubmit: () => {}, isLoading: false },
};
```

**Step 3: Create AuthForm component**

```tsx
// components/auth/AuthForm.tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface Props {
  mode: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; role?: string }) => void;
  isLoading: boolean;
}

export function AuthForm({ mode, onSubmit, isLoading }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'diner' | 'restaurant_owner'>('diner');

  return (
    <View className="flex-1 justify-center px-6">
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {mode === 'register' && (
        <View className="flex-row mb-4 gap-2">
          {(['diner', 'restaurant_owner'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              className={`flex-1 py-3 rounded-lg ${role === r ? 'bg-orange-500' : 'bg-gray-200'}`}
              onPress={() => setRole(r)}
            >
              <Text className={`text-center ${role === r ? 'text-white' : 'text-gray-700'}`}>
                {r === 'diner' ? 'Diner' : 'Restaurant'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        className="bg-orange-500 rounded-lg py-4"
        onPress={() => onSubmit({ email, password, role: mode === 'register' ? role : undefined })}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="white" /> : (
          <Text className="text-white text-center font-semibold">
            {mode === 'login' ? 'Log In' : 'Register'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
```

**Step 4: Create login and register screens**

```tsx
// app/(auth)/login.tsx
import { router } from 'expo-router';
import { AuthForm } from '../../components/auth/AuthForm';
import { useLogin } from '../../hooks/useAuth';

export default function LoginScreen() {
  const login = useLogin();
  return (
    <AuthForm
      mode="login"
      isLoading={login.isPending}
      onSubmit={(data) => login.mutate(data as any, {
        onSuccess: () => router.replace('/(diner)/feed'),
      })}
    />
  );
}
```

**Step 5: Commit**

```bash
git add mobile/app/(auth)/ mobile/hooks/useAuth.ts mobile/components/auth/
git commit -m "feat: add login and register screens"
```

---

### Task 12: Swipe Feed Screen

**Files:**
- Create: `mobile/app/(diner)/feed.tsx`
- Create: `mobile/components/swipe/RestaurantCard.tsx`
- Create: `mobile/components/swipe/RestaurantCard.stories.tsx`
- Create: `mobile/hooks/useRestaurants.ts`

**Step 1: Create data hook**

```typescript
// hooks/useRestaurants.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  price_range: number;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  phone: string;
  opening_hours: Record<string, string>;
}

export function useSwipeFeed(lat: number, lng: number) {
  return useInfiniteQuery({
    queryKey: ['restaurants', lat, lng],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<Restaurant[]>('/restaurants', {
        params: { lat, lng, radius_km: 10, page: pageParam },
      });
      return res.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useSwipe() {
  return useMutation({
    mutationFn: (data: { restaurant_id: number; direction: 'left' | 'right' }) =>
      api.post('/swipes', data),
  });
}
```

**Step 2: Create Storybook story**

```tsx
// components/swipe/RestaurantCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import { RestaurantCard } from './RestaurantCard';

const meta: Meta<typeof RestaurantCard> = {
  title: 'Swipe/RestaurantCard',
  component: RestaurantCard,
};
export default meta;

export const Default: StoryObj<typeof RestaurantCard> = {
  args: {
    restaurant: {
      id: 1, name: 'Pho 24', cuisine_type: 'Vietnamese', price_range: 2,
      address: '123 Nguyen Hue, HCMC', description: 'Best pho in town',
      phone: '0901234567', latitude: 10.77, longitude: 106.69, opening_hours: {}
    },
  },
};
```

**Step 3: Create RestaurantCard component**

```tsx
// components/swipe/RestaurantCard.tsx
import { View, Text, Image } from 'react-native';

interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  price_range: number;
  address: string;
  description: string;
  phone: string;
  latitude: number;
  longitude: number;
  opening_hours: Record<string, string>;
}

interface Props {
  restaurant: Restaurant;
}

const PRICE_SYMBOLS = ['', '$', '$$', '$$$', '$$$$'];

export function RestaurantCard({ restaurant }: Props) {
  return (
    <View className="bg-white rounded-2xl shadow-lg overflow-hidden w-full aspect-[3/4]">
      <View className="flex-1 bg-gray-200 items-center justify-center">
        <Text className="text-gray-400">No photo</Text>
      </View>
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900">{restaurant.name}</Text>
        <View className="flex-row items-center mt-1 gap-2">
          <Text className="text-gray-500">{restaurant.cuisine_type}</Text>
          <Text className="text-gray-400">·</Text>
          <Text className="text-gray-500">{PRICE_SYMBOLS[restaurant.price_range]}</Text>
        </View>
        <Text className="text-gray-400 text-sm mt-1">{restaurant.address}</Text>
      </View>
    </View>
  );
}
```

**Step 4: Create swipe feed screen**

```tsx
// app/(diner)/feed.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRef } from 'react';
import { router } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { RestaurantCard } from '../../components/swipe/RestaurantCard';
import { useSwipeFeed, useSwipe } from '../../hooks/useRestaurants';

export default function FeedScreen() {
  const { data, fetchNextPage } = useSwipeFeed(10.77, 106.69);
  const swipe = useSwipe();
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const restaurants = data?.pages.flat() ?? [];
  const current = restaurants[0];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!current) return;
    swipe.mutate({ restaurant_id: current.id, direction });
    if (direction === 'right') router.push(`/(diner)/restaurant/${current.id}`);
    translateX.value = 0;
    rotate.value = 0;
    if (restaurants.length <= 3) fetchNextPage();
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotate.value = e.translationX / 20;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 120) {
        runOnJS(handleSwipe)(e.translationX > 0 ? 'right' : 'left');
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
  }));

  if (!current) return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-gray-500">No more restaurants nearby</Text>
    </View>
  );

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-4">
      <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedStyle, { width: '100%' }]}>
          <RestaurantCard restaurant={current} />
        </Animated.View>
      </GestureDetector>
      <View className="flex-row gap-6 mt-6">
        <TouchableOpacity className="bg-red-100 rounded-full p-4" onPress={() => handleSwipe('left')}>
          <Text className="text-2xl">✕</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-green-100 rounded-full p-4" onPress={() => handleSwipe('right')}>
          <Text className="text-2xl">♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**Step 5: Commit**

```bash
git add mobile/app/(diner)/feed.tsx mobile/components/swipe/ mobile/hooks/useRestaurants.ts
git commit -m "feat: add swipe feed screen with gesture handling"
```

---

### Task 13: Restaurant Detail + Reservation Form

**Files:**
- Create: `mobile/app/(diner)/restaurant/[id].tsx`
- Create: `mobile/components/reservation/ReservationForm.tsx`
- Create: `mobile/components/reservation/ReservationForm.stories.tsx`
- Create: `mobile/hooks/useReservations.ts`

**Step 1: Create reservation hook**

```typescript
// hooks/useReservations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Reservation {
  id: number;
  restaurant_id: number;
  party_size: number;
  requested_at: string;
  note?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
}

export function useMyReservations() {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await api.get<Reservation[]>('/reservations');
      return res.data;
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { restaurant_id: number; party_size: number; requested_at: string; note?: string }) =>
      api.post('/reservations', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/reservations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });
}
```

**Step 2: Create Storybook story**

```tsx
// components/reservation/ReservationForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import { ReservationForm } from './ReservationForm';

const meta: Meta<typeof ReservationForm> = {
  title: 'Reservation/ReservationForm',
  component: ReservationForm,
};
export default meta;

export const Default: StoryObj<typeof ReservationForm> = {
  args: { restaurantId: 1, onSubmit: () => {}, isLoading: false },
};
```

**Step 3: Create ReservationForm component**

```tsx
// components/reservation/ReservationForm.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface Props {
  restaurantId: number;
  onSubmit: (data: { restaurant_id: number; party_size: number; requested_at: string; note?: string }) => void;
  isLoading: boolean;
}

export function ReservationForm({ restaurantId, onSubmit, isLoading }: Props) {
  const [partySize, setPartySize] = useState('2');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  return (
    <View className="p-6">
      <Text className="text-lg font-semibold mb-4">Make a Reservation</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Party size"
        value={partySize}
        onChangeText={setPartySize}
        keyboardType="numeric"
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Date & time (e.g. 2026-03-10 19:00)"
        value={date}
        onChangeText={setDate}
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder="Special requests (optional)"
        value={note}
        onChangeText={setNote}
        multiline
      />
      <TouchableOpacity
        className="bg-orange-500 rounded-lg py-4"
        onPress={() => onSubmit({ restaurant_id: restaurantId, party_size: Number(partySize), requested_at: date, note })}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="white" /> : (
          <Text className="text-white text-center font-semibold">Request Reservation</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
```

**Step 4: Create restaurant detail screen**

```tsx
// app/(diner)/restaurant/[id].tsx
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ReservationForm } from '../../../components/reservation/ReservationForm';
import { useCreateReservation } from '../../../hooks/useReservations';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => (await api.get(`/restaurants/${id}`)).data,
  });
  const createReservation = useCreateReservation();

  if (!restaurant) return null;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="h-64 bg-gray-200 items-center justify-center">
        <Text className="text-gray-400">Photos</Text>
      </View>
      <View className="p-6">
        <Text className="text-2xl font-bold">{restaurant.name}</Text>
        <Text className="text-gray-500 mt-1">{restaurant.cuisine_type} · {'$'.repeat(restaurant.price_range)}</Text>
        <Text className="text-gray-600 mt-4">{restaurant.description}</Text>

        <TouchableOpacity
          className="flex-row items-center mt-4 gap-2"
          onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}
        >
          <Text className="text-orange-500 font-medium">📞 {restaurant.phone}</Text>
        </TouchableOpacity>

        <View className="mt-6 border-t border-gray-100 pt-6">
          <ReservationForm
            restaurantId={restaurant.id}
            isLoading={createReservation.isPending}
            onSubmit={(data) => createReservation.mutate(data, {
              onSuccess: () => router.push('/(diner)/reservations'),
            })}
          />
        </View>
      </View>
    </ScrollView>
  );
}
```

**Step 5: Commit**

```bash
git add mobile/app/(diner)/restaurant/ mobile/components/reservation/ mobile/hooks/useReservations.ts
git commit -m "feat: add restaurant detail and reservation form"
```

---

### Task 14: Owner Profile Management Screen

**Files:**
- Create: `mobile/app/(owner)/profile.tsx`
- Create: `mobile/hooks/useMyRestaurant.ts`

**Step 1: Create owner restaurant hook**

```typescript
// hooks/useMyRestaurant.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMyRestaurant() {
  return useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => (await api.get('/my/restaurant')).data,
    retry: false,
  });
}

export function useCreateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post('/my/restaurant', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-restaurant'] }),
  });
}

export function useUpdateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.patch('/my/restaurant', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-restaurant'] }),
  });
}
```

**Step 2: Create owner profile screen**

```tsx
// app/(owner)/profile.tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useMyRestaurant, useCreateRestaurant, useUpdateRestaurant } from '../../hooks/useMyRestaurant';

export default function OwnerProfileScreen() {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const create = useCreateRestaurant();
  const update = useUpdateRestaurant();
  const isEdit = !!restaurant;

  const [form, setForm] = useState({
    name: '', cuisine_type: '', price_range: '2', phone: '', address: '', description: ''
  });

  useEffect(() => {
    if (restaurant) setForm({
      name: restaurant.name, cuisine_type: restaurant.cuisine_type,
      price_range: String(restaurant.price_range), phone: restaurant.phone,
      address: restaurant.address, description: restaurant.description ?? ''
    });
  }, [restaurant]);

  const handleSubmit = () => {
    const data = { ...form, price_range: Number(form.price_range) };
    isEdit ? update.mutate(data) : create.mutate(data);
  };

  if (isLoading) return <ActivityIndicator className="flex-1" />;

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-6">{isEdit ? 'Edit Profile' : 'Create Profile'}</Text>
      {[
        { key: 'name', label: 'Restaurant Name' },
        { key: 'cuisine_type', label: 'Cuisine Type' },
        { key: 'price_range', label: 'Price Range (1-4)', numeric: true },
        { key: 'phone', label: 'Phone Number', numeric: true },
        { key: 'address', label: 'Address' },
        { key: 'description', label: 'Description', multiline: true },
      ].map(({ key, label, numeric, multiline }) => (
        <View key={key} className="mb-4">
          <Text className="text-gray-600 mb-1">{label}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={form[key as keyof typeof form]}
            onChangeText={(v) => setForm(f => ({ ...f, [key]: v }))}
            keyboardType={numeric ? 'numeric' : 'default'}
            multiline={multiline}
          />
        </View>
      ))}
      <TouchableOpacity
        className="bg-orange-500 rounded-lg py-4 mt-2"
        onPress={handleSubmit}
        disabled={create.isPending || update.isPending}
      >
        <Text className="text-white text-center font-semibold">
          {isEdit ? 'Save Changes' : 'Create Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

**Step 3: Commit**

```bash
git add mobile/app/(owner)/profile.tsx mobile/hooks/useMyRestaurant.ts
git commit -m "feat: add owner restaurant profile management screen"
```

---

### Task 15: Owner Reservation Inbox

**Files:**
- Create: `mobile/app/(owner)/reservations.tsx`
- Create: `mobile/hooks/useOwnerReservations.ts`
- Create: `mobile/components/reservation/ReservationCard.tsx`
- Create: `mobile/components/reservation/ReservationCard.stories.tsx`

**Step 1: Create owner reservations hook**

```typescript
// hooks/useOwnerReservations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useOwnerReservations() {
  return useQuery({
    queryKey: ['owner-reservations'],
    queryFn: async () => (await api.get('/my/reservations')).data,
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'confirmed' | 'rejected' }) =>
      api.patch(`/my/reservations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-reservations'] }),
  });
}
```

**Step 2: Create Storybook story**

```tsx
// components/reservation/ReservationCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import { ReservationCard } from './ReservationCard';

const meta: Meta<typeof ReservationCard> = {
  title: 'Reservation/ReservationCard',
  component: ReservationCard,
};
export default meta;

export const Pending: StoryObj<typeof ReservationCard> = {
  args: {
    reservation: { id: 1, party_size: 3, requested_at: '2026-03-10T19:00:00', note: 'Window seat', status: 'pending' },
    onConfirm: () => {}, onReject: () => {},
  },
};
```

**Step 3: Create ReservationCard component**

```tsx
// components/reservation/ReservationCard.tsx
import { View, Text, TouchableOpacity } from 'react-native';

interface Reservation {
  id: number;
  party_size: number;
  requested_at: string;
  note?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
}

interface Props {
  reservation: Reservation;
  onConfirm?: (id: number) => void;
  onReject?: (id: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export function ReservationCard({ reservation, onConfirm, onReject }: Props) {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
      <View className="flex-row justify-between items-center">
        <Text className="font-semibold text-gray-900">Party of {reservation.party_size}</Text>
        <Text className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[reservation.status]}`}>
          {reservation.status}
        </Text>
      </View>
      <Text className="text-gray-500 text-sm mt-1">{new Date(reservation.requested_at).toLocaleString()}</Text>
      {reservation.note && <Text className="text-gray-600 mt-2 italic">"{reservation.note}"</Text>}
      {reservation.status === 'pending' && onConfirm && onReject && (
        <View className="flex-row gap-3 mt-3">
          <TouchableOpacity
            className="flex-1 bg-green-500 rounded-lg py-2"
            onPress={() => onConfirm(reservation.id)}
          >
            <Text className="text-white text-center font-medium">Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-red-500 rounded-lg py-2"
            onPress={() => onReject(reservation.id)}
          >
            <Text className="text-white text-center font-medium">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

**Step 4: Create owner reservations screen**

```tsx
// app/(owner)/reservations.tsx
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { ReservationCard } from '../../components/reservation/ReservationCard';
import { useOwnerReservations, useUpdateReservationStatus } from '../../hooks/useOwnerReservations';

export default function OwnerReservationsScreen() {
  const { data: reservations, isLoading } = useOwnerReservations();
  const updateStatus = useUpdateReservationStatus();

  if (isLoading) return <ActivityIndicator className="flex-1" />;

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-4">
      <Text className="text-xl font-bold mb-4">Reservation Requests</Text>
      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ReservationCard
            reservation={item}
            onConfirm={(id) => updateStatus.mutate({ id, status: 'confirmed' })}
            onReject={(id) => updateStatus.mutate({ id, status: 'rejected' })}
          />
        )}
        ListEmptyComponent={<Text className="text-gray-400 text-center mt-8">No reservations yet</Text>}
      />
    </View>
  );
}
```

**Step 5: Commit**

```bash
git add mobile/app/(owner)/reservations.tsx mobile/hooks/useOwnerReservations.ts mobile/components/reservation/ReservationCard.tsx mobile/components/reservation/ReservationCard.stories.tsx
git commit -m "feat: add owner reservation inbox with confirm/reject"
```

---

## Final Verification

**Step 1: Run full backend test suite**

```bash
cd backend && bundle exec rspec --format documentation
```
Expected: All examples pass, 0 failures

**Step 2: Run TypeScript check**

```bash
cd mobile && npx tsc --noEmit
```
Expected: No type errors

**Step 3: Verify Storybook loads**

```bash
cd mobile && npx storybook
```
Expected: All stories render (AuthForm, RestaurantCard, ReservationForm, ReservationCard)

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: food tinder MVP complete"
```
