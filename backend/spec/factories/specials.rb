FactoryBot.define do
  factory :special do
    association :restaurant
    title { 'Happy Hour' }
    description { '50% off selected drinks' }
    valid_until { 1.week.from_now.to_date }
  end
end
