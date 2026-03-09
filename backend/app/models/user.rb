class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :jwt_authenticatable,
         jwt_revocation_strategy: JwtDenylist

  enum :role, { diner: 0, restaurant_owner: 1 }

  has_one :restaurant, foreign_key: :owner_id
  has_many :reservations

  validates :role, presence: true, inclusion: { in: roles.keys }
  validates :email, presence: true, uniqueness: { case_sensitive: false }
end
