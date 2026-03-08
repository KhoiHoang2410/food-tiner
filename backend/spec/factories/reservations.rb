FactoryBot.define do
  factory :reservation do
    association :user
    association :restaurant
    party_size { 2 }
    requested_at { 1.day.from_now }
    status { :pending }
  end
end
