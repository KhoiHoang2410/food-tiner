class CreateSpecials < ActiveRecord::Migration[8.0]
  def change
    create_table :specials do |t|
      t.references :restaurant, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.date :valid_until

      t.timestamps
    end
  end
end
