module Api
  module V1
    module My
      class SpecialsController < Api::V1::BaseController
        before_action :require_owner!

        def create
          special = restaurant.specials.create!(special_params)
          render json: special, status: :created
        end

        def destroy
          restaurant.specials.find(params[:id]).destroy
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

        def special_params
          params.permit(:title, :description, :valid_until)
        end
      end
    end
  end
end
