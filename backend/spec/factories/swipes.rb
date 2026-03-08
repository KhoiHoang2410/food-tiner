FactoryBot.define do
  factory :swipe do
    association :user
    association :restaurant
    direction { :right }
  end
end
