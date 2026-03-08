class CreateSwipes < ActiveRecord::Migration[8.0]
  def change
    create_table :swipes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :restaurant, null: false, foreign_key: true
      t.integer :direction

      t.timestamps
    end
  end
end
