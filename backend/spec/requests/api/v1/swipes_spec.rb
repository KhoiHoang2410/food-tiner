require 'rails_helper'

RSpec.describe 'Swipes API', type: :request do
  let(:diner) { create(:user) }
  let!(:restaurant) { create(:restaurant) }
  let(:headers) { auth_headers(diner) }

  describe 'POST /api/v1/swipes' do
    it 'records a right swipe' do
      post '/api/v1/swipes', params: { restaurant_id: restaurant.id, direction: 'right' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(Swipe.last.direction).to eq('right')
    end

    it 'records a left swipe' do
      post '/api/v1/swipes', params: { restaurant_id: restaurant.id, direction: 'left' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(Swipe.last.direction).to eq('left')
    end

    it 'upserts on duplicate swipe' do
      create(:swipe, user: diner, restaurant: restaurant, direction: :left)
      post '/api/v1/swipes', params: { restaurant_id: restaurant.id, direction: 'right' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(Swipe.where(user: diner, restaurant: restaurant).count).to eq(1)
      expect(Swipe.last.direction).to eq('right')
    end
  end
end
