require 'rails_helper'

RSpec.describe 'Restaurants API', type: :request do
  let(:diner) { create(:user) }
  let(:headers) { auth_headers(diner) }

  describe 'GET /api/v1/restaurants' do
    let!(:nearby) do
      create(:restaurant, latitude: 10.77, longitude: 106.69, cuisine_type: 'Vietnamese', price_range: 2)
    end
    let!(:far_away) { create(:restaurant, latitude: 20.0, longitude: 100.0) }

    it 'returns restaurants within radius' do
      get '/api/v1/restaurants', params: { lat: 10.77, lng: 106.69, radius_km: 5 }, headers: headers
      names = JSON.parse(response.body).map { |r| r['name'] }
      expect(names).to include(nearby.name)
      expect(names).not_to include(far_away.name)
    end

    it 'filters by cuisine_type' do
      get '/api/v1/restaurants', params: {
        lat: 10.77, lng: 106.69, radius_km: 50, cuisine: 'Vietnamese'
      }, headers: headers
      body = JSON.parse(response.body)
      expect(body).not_to be_empty
      expect(body.all? { |r| r['cuisine_type'] == 'Vietnamese' }).to be true
    end

    it 'excludes already-swiped restaurants when unswiped ones remain' do
      nearby2 = create(:restaurant, latitude: 10.771, longitude: 106.691)
      create(:swipe, user: diner, restaurant: nearby, direction: :left)
      get '/api/v1/restaurants', params: { lat: 10.77, lng: 106.69, radius_km: 5 }, headers: headers
      names = JSON.parse(response.body).map { |r| r['name'] }
      expect(names).not_to include(nearby.name)
      expect(names).to include(nearby2.name)
    end

    it 'returns all restaurants when all have been swiped (circular feed)' do
      create(:swipe, user: diner, restaurant: nearby, direction: :left)
      get '/api/v1/restaurants', params: { lat: 10.77, lng: 106.69, radius_km: 5 }, headers: headers
      names = JSON.parse(response.body).map { |r| r['name'] }
      expect(names).to include(nearby.name)
    end
  end

  describe 'GET /api/v1/restaurants/:id' do
    let!(:restaurant) { create(:restaurant) }

    it 'returns restaurant detail' do
      get "/api/v1/restaurants/#{restaurant.id}", headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['id']).to eq(restaurant.id)
    end
  end
end
