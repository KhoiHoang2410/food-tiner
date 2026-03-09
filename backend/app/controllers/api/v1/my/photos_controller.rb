module Api
  module V1
    module My
      class PhotosController < Api::V1::BaseController
        before_action :require_owner!

        def create
          raise FoodTinderError.new('TF3003') if restaurant.photos.count >= 5

          restaurant.photos.attach(params[:photo])
          render json: { message: 'Photo uploaded' }, status: :created
        end

        def destroy
          attachment = restaurant.photos.find(params[:id])
          attachment.purge
          head :no_content
        end

        private

        def restaurant
          @restaurant ||= Restaurant.find_by(owner_id: current_user.id) ||
                          raise(FoodTinderError.new('TF3001'))
        end

        def require_owner!
          require_role!(:restaurant_owner)
        end
      end
    end
  end
end
