require 'rails_helper'

RSpec.describe 'Restaurant Specials', type: :request do
  let(:owner) { create(:user, :restaurant_owner) }
  let!(:restaurant) { create(:restaurant, user: owner) }
  let(:headers) { auth_headers(owner) }

  describe 'POST /api/v1/my/specials' do
    it 'creates a special' do
      post '/api/v1/my/specials', params: {
        title: 'Happy Hour', description: '50% off drinks', valid_until: 1.week.from_now.to_date
      }, headers: headers
      expect(response).to have_http_status(:created)
      expect(restaurant.reload.specials.count).to eq(1)
    end
  end

  describe 'DELETE /api/v1/my/specials/:id' do
    let!(:special) { create(:special, restaurant: restaurant) }

    it 'deletes the special' do
      delete "/api/v1/my/specials/#{special.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(restaurant.reload.specials.count).to eq(0)
    end
  end
end
