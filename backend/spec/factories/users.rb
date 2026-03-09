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
