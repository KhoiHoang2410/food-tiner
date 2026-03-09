require 'rails_helper'

RSpec.describe 'Restaurant Photos', type: :request do
  let(:owner) { create(:user, :restaurant_owner) }
  let!(:restaurant) { create(:restaurant, user: owner) }
  let(:headers) { auth_headers(owner) }
  let(:photo) { fixture_file_upload('spec/fixtures/test.jpg', 'image/jpeg') }

  describe 'POST /api/v1/my/photos' do
    it 'attaches a photo' do
      post '/api/v1/my/photos', params: { photo: photo }, headers: headers
      expect(response).to have_http_status(:created)
      expect(restaurant.reload.photos.count).to eq(1)
    end

    it 'returns TF3003 when 5 photos already attached' do
      5.times do
        restaurant.photos.attach(
          io: File.open(Rails.root.join('spec/fixtures/test.jpg')),
          filename: 'test.jpg',
          content_type: 'image/jpeg'
        )
      end
      post '/api/v1/my/photos', params: { photo: photo }, headers: headers
      expect(JSON.parse(response.body)['errors'].first['error_code']).to eq('TF3003')
    end
  end

  describe 'DELETE /api/v1/my/photos/:id' do
    it 'removes a photo' do
      restaurant.photos.attach(
        io: File.open(Rails.root.join('spec/fixtures/test.jpg')),
        filename: 'test.jpg',
        content_type: 'image/jpeg'
      )
      attachment_id = restaurant.photos.first.id
      delete "/api/v1/my/photos/#{attachment_id}", headers: headers
      expect(response).to have_http_status(:no_content)
    end
  end
end
