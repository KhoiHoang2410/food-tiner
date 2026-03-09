require 'rails_helper'

RSpec.describe 'Auth API', type: :request do
  describe 'POST /api/v1/auth/register' do
    it 'registers a diner' do
      post '/api/v1/auth/register', params: {
        email: 'test@example.com', password: 'password123', role: 'diner'
      }
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)['token']).to be_present
    end

    it 'returns TF1004 when email taken' do
      create(:user, email: 'test@example.com')
      post '/api/v1/auth/register', params: {
        email: 'test@example.com', password: 'password123', role: 'diner'
      }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF1004')
    end

    it 'returns TF1005 for invalid role' do
      post '/api/v1/auth/register', params: {
        email: 'test@example.com', password: 'password123', role: 'admin'
      }
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF1005')
    end
  end

  describe 'POST /api/v1/auth/login' do
    let!(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    it 'logs in with valid credentials' do
      post '/api/v1/auth/login', params: { email: 'test@example.com', password: 'password123' }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['token']).to be_present
    end

    it 'returns TF1003 for invalid credentials' do
      post '/api/v1/auth/login', params: { email: 'test@example.com', password: 'wrong' }
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF1003')
    end
  end
end
