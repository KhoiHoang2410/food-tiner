module Api
  module V1
    class SwipesController < Api::V1::BaseController
      def create
        swipe = Swipe.find_or_initialize_by(user: current_user, restaurant_id: params[:restaurant_id])
        swipe.direction = params[:direction]
        swipe.save!
        render json: swipe, status: :created
      end
    end
  end
end
