FactoryBot.define do
  factory :restaurant do
    transient do
      user { create(:user, :restaurant_owner) }
    end

    name { Faker::Company.name }
    description { Faker::Lorem.paragraph }
    phone { Faker::PhoneNumber.cell_phone }
    address { Faker::Address.full_address }
    latitude { 10.77 }
    longitude { 106.69 }
    cuisine_type { 'Vietnamese' }
    price_range { 2 }
    is_active { true }
    opening_hours { { 'mon' => '08:00-22:00' } }

    after(:build) do |restaurant, evaluator|
      restaurant.owner_id = evaluator.user.id
    end
  end
end
