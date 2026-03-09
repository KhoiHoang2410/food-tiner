module Api
  module V1
    module My
      class RestaurantsController < Api::V1::BaseController
        before_action :require_owner!

        def show
          render json: restaurant_json(my_restaurant)
        end

        def create
          raise FoodTinderError.new('TF3002') if Restaurant.exists?(owner_id: current_user.id)

          restaurant = Restaurant.create!(restaurant_params.merge(owner_id: current_user.id))
          render json: restaurant_json(restaurant), status: :created
        end

        def update
          my_restaurant.update!(restaurant_params)
          render json: restaurant_json(my_restaurant)
        end

        private

        def my_restaurant
          @my_restaurant ||= Restaurant.find_by(owner_id: current_user.id) ||
                             raise(FoodTinderError.new('TF3001'))
        end

        def require_owner!
          require_role!(:restaurant_owner)
        end

        def restaurant_params
          permitted = params.permit(:name, :description, :phone, :address, :latitude, :longitude,
                                    :cuisine_type, :price_range, :is_active, opening_hours: {})
          permitted[:price_range] = permitted[:price_range].to_i if permitted[:price_range].present?
          permitted
        end

        def restaurant_json(restaurant)
          restaurant.as_json(except: [:owner_id]).merge('user_id' => restaurant.owner_id)
        end
      end
    end
  end
end
