class Restaurant < ApplicationRecord
  belongs_to :user, foreign_key: :owner_id
  has_many_attached :photos
  has_many :specials, dependent: :destroy
  has_many :reservations, dependent: :destroy

  enum :price_range, { budget: 1, moderate: 2, pricey: 3, luxury: 4 }

  validates :name, :phone, :address, :cuisine_type, presence: true
  validates :price_range, presence: true
  validates :latitude, :longitude, numericality: true, allow_nil: true
end
