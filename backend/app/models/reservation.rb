class Reservation < ApplicationRecord
  belongs_to :user
  belongs_to :restaurant
  enum :status, { pending: 0, confirmed: 1, rejected: 2, cancelled: 3 }
  validates :party_size, :requested_at, :status, presence: true
end
