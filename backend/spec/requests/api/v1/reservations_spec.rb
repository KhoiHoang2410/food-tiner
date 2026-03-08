require 'rails_helper'

RSpec.describe 'Reservations API', type: :request do
  let(:diner) { create(:user) }
  let(:owner) { create(:user, :restaurant_owner) }
  let!(:restaurant) { create(:restaurant, user: owner) }
  let(:diner_headers) { auth_headers(diner) }
  let(:owner_headers) { auth_headers(owner) }

  describe 'POST /api/v1/reservations (diner)' do
    it 'creates a pending reservation' do
      post '/api/v1/reservations', params: {
        restaurant_id: restaurant.id, party_size: 2,
        requested_at: 1.day.from_now.iso8601, note: 'Window seat please'
      }, headers: diner_headers
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)['status']).to eq('pending')
    end

    it 'returns TF4002 for duplicate pending reservation' do
      create(:reservation, user: diner, restaurant: restaurant, status: :pending)
      post '/api/v1/reservations', params: {
        restaurant_id: restaurant.id, party_size: 2, requested_at: 1.day.from_now.iso8601
      }, headers: diner_headers
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF4002')
    end
  end

  describe 'GET /api/v1/reservations (diner)' do
    let!(:reservation) { create(:reservation, user: diner, restaurant: restaurant) }

    it 'returns diner reservations' do
      get '/api/v1/reservations', headers: diner_headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end
  end

  describe 'DELETE /api/v1/reservations/:id (diner cancel)' do
    let!(:reservation) { create(:reservation, user: diner, restaurant: restaurant, status: :pending) }

    it 'cancels a pending reservation' do
      delete "/api/v1/reservations/#{reservation.id}", headers: diner_headers
      expect(response).to have_http_status(:ok)
      expect(reservation.reload.status).to eq('cancelled')
    end

    it 'returns TF4003 for confirmed reservation' do
      reservation.update!(status: :confirmed)
      delete "/api/v1/reservations/#{reservation.id}", headers: diner_headers
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF4003')
    end
  end

  describe 'GET /api/v1/my/reservations (owner)' do
    let!(:reservation) { create(:reservation, user: diner, restaurant: restaurant) }

    it 'returns owner reservations' do
      get '/api/v1/my/reservations', headers: owner_headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end
  end

  describe 'PATCH /api/v1/my/reservations/:id (owner)' do
    let!(:reservation) { create(:reservation, user: diner, restaurant: restaurant, status: :pending) }

    it 'confirms a reservation' do
      patch "/api/v1/my/reservations/#{reservation.id}", params: { status: 'confirmed' }, headers: owner_headers
      expect(response).to have_http_status(:ok)
      expect(reservation.reload.status).to eq('confirmed')
    end

    it 'rejects a reservation' do
      patch "/api/v1/my/reservations/#{reservation.id}", params: { status: 'rejected' }, headers: owner_headers
      expect(response).to have_http_status(:ok)
      expect(reservation.reload.status).to eq('rejected')
    end
  end
end
