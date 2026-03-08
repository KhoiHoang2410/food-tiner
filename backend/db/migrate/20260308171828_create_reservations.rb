class CreateReservations < ActiveRecord::Migration[8.0]
  def change
    create_table :reservations do |t|
      t.references :user, null: false, foreign_key: true
      t.references :restaurant, null: false, foreign_key: true
      t.integer :party_size
      t.datetime :requested_at
      t.text :note
      t.integer :status

      t.timestamps
    end
  end
end
