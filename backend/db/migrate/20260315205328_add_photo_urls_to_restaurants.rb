class AddPhotoUrlsToRestaurants < ActiveRecord::Migration[8.0]
  def change
    add_column :restaurants, :photo_urls, :text, array: true, default: [], null: false
  end
end
