class Swipe < ApplicationRecord
  belongs_to :user
  belongs_to :restaurant
  enum :direction, { left: 0, right: 1 }
  validates :direction, presence: true
end
