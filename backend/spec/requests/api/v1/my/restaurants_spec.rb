require 'rails_helper'

RSpec.describe 'My Restaurant API', type: :request do
  let(:owner) { create(:user, :restaurant_owner) }
  let(:headers) { auth_headers(owner) }

  describe 'GET /api/v1/my/restaurant' do
    context 'when restaurant exists' do
      let!(:restaurant) { create(:restaurant, user: owner) }

      it 'returns the restaurant' do
        get '/api/v1/my/restaurant', headers: headers
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['name']).to eq(restaurant.name)
      end
    end

    it 'returns TF3001 when no restaurant' do
      get '/api/v1/my/restaurant', headers: headers
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF3001')
    end
  end

  describe 'POST /api/v1/my/restaurant' do
    it 'creates a restaurant' do
      post '/api/v1/my/restaurant', params: {
        name: 'Pho House', cuisine_type: 'Vietnamese', price_range: 2,
        phone: '0901234567', address: '123 Main St', latitude: 10.77, longitude: 106.69
      }, headers: headers
      expect(response).to have_http_status(:created)
    end

    it 'returns TF3002 when restaurant already exists' do
      create(:restaurant, user: owner)
      post '/api/v1/my/restaurant', params: {
        name: 'Another', cuisine_type: 'Thai', price_range: 1, phone: '0912345678', address: 'Somewhere'
      }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF3002')
    end
  end

  describe 'PATCH /api/v1/my/restaurant' do
    let!(:restaurant) { create(:restaurant, user: owner) }

    it 'updates the restaurant' do
      patch '/api/v1/my/restaurant', params: { name: 'New Name' }, headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['name']).to eq('New Name')
    end
  end

  describe 'role guard' do
    it 'returns TF2001 for diner role' do
      diner = create(:user)
      get '/api/v1/my/restaurant', headers: auth_headers(diner)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF2001')
    end
  end
end
