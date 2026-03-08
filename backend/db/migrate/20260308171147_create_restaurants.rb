class CreateRestaurants < ActiveRecord::Migration[8.0]
  def change
    create_table :restaurants do |t|
      t.integer :owner_id
      t.string :name
      t.text :description
      t.string :phone
      t.string :address
      t.decimal :latitude
      t.decimal :longitude
      t.string :cuisine_type
      t.integer :price_range
      t.jsonb :opening_hours
      t.boolean :is_active

      t.timestamps
    end
  end
end
