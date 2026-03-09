# Food Tinder — Backend

Rails 8 API serving the Food Tinder mobile app. Handles authentication, restaurant management, geo-filtered swipe feed, and reservations.

## Tech Stack

| | |
|---|---|
| **Language** | Ruby 3.2.0 |
| **Framework** | Rails 8.0 (API mode) |
| **Database** | PostgreSQL |
| **Auth** | Devise + devise-jwt (JWT tokens) |
| **File Storage** | ActiveStorage (local in dev, S3 in prod) |
| **Geo-filtering** | geocoder + kaminari |
| **Testing** | RSpec, FactoryBot, DatabaseCleaner, Shoulda Matchers |

## Prerequisites

- Ruby 3.2.0 (use [rbenv](https://github.com/rbenv/rbenv) or [rvm](https://rvm.io/))
- PostgreSQL 14+
- Bundler (`gem install bundler`)

## Setup

**1. Install dependencies**

```bash
bundle install
```

**2. Configure database**

Edit `config/database.yml` if your PostgreSQL credentials differ from the defaults, then:

```bash
rails db:create db:migrate
```

**3. Seed data (optional)**

```bash
rails db:seed
```

## Running Locally

```bash
rails server
```

The API will be available at `http://localhost:3000`.

Health check: `GET http://localhost:3000/up`

## Running Tests

```bash
bundle exec rspec
```

To run a specific file:

```bash
bundle exec rspec spec/requests/api/v1/auth_spec.rb
```

Expected output: **40 examples, 0 failures**

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | uses `config/database.yml` |
| `SECRET_KEY_BASE` | Rails secret key | auto-generated in `credentials.yml.enc` |
| `AWS_ACCESS_KEY_ID` | S3 access key (production) | — |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key (production) | — |
| `AWS_BUCKET` | S3 bucket name (production) | — |
| `AWS_REGION` | S3 region (production) | — |

## Project Structure

```
app/
├── controllers/
│   └── api/v1/
│       ├── auth_controller.rb
│       ├── restaurants_controller.rb
│       ├── swipes_controller.rb
│       ├── reservations_controller.rb
│       └── my/
│           ├── restaurants_controller.rb
│           ├── photos_controller.rb
│           ├── specials_controller.rb
│           └── reservations_controller.rb
├── lib/
│   └── food_tinder_error.rb    # standardized error codes (TF1001–TF5003)
└── models/
    ├── user.rb
    ├── restaurant.rb
    ├── special.rb
    ├── swipe.rb
    └── reservation.rb
spec/
├── factories/
├── requests/api/v1/
└── support/
    └── auth_helpers.rb
```

## Authentication

All endpoints (except `auth/register` and `auth/login`) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued on login/register and expire after **24 hours**.

## Key Design Decisions

- `Restaurant.owner_id` is the FK column; Rails association uses `belongs_to :user, foreign_key: :owner_id`
- Swipes are idempotent — duplicate swipe on same restaurant upserts direction
- Reservations are soft-cancelled (status: `cancelled`), never destroyed
- `price_range` is an integer enum: `1=budget 2=moderate 3=pricey 4=luxury`
- Geo-filtering uses the `geocoder` gem's `near` scope with km units
