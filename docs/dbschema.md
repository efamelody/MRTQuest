erDiagram

  profiles {
    uuid id PK
    text username
    text avatar_url
    timestamp created_at
  }

  stations {
    uuid id PK
    text name
    text line
    float latitude
    float longitude
    timestamp created_at
  }

  attractions {
    uuid id PK
    uuid station_id FK
    text name
    text description
    float latitude
    float longitude
    text image_url
    timestamp created_at
  }

  reviews {
    uuid id PK
    uuid user_id FK
    uuid site_id FK
    int rating
    text comment
    timestamp created_at
  }

  visits {
    uuid id PK
    uuid user_id FK
    uuid site_id FK
    timestamp visited_at
  }

  quizzes {
    uuid id PK
    uuid site_id FK
    text question
    text correct_answer
  }

  user_quiz_attempts {
    uuid id PK
    uuid user_id FK
    uuid quiz_id FK
    boolean is_correct
    timestamp attempted_at
  }

  badges {
    uuid id PK
    text name
    text description
    text icon
  }

  user_badges {
    uuid id PK
    uuid user_id FK
    uuid badge_id FK
    timestamp earned_at
  }

  %% Relationships
  stations ||--o{ attractions : has
  attractions ||--o{ reviews : receives
  attractions ||--o{ visits : visited_at
  attractions ||--o{ quizzes : has

  profiles ||--o{ reviews : writes
  profiles ||--o{ visits : makes
  profiles ||--o{ user_quiz_attempts : attempts
  profiles ||--o{ user_badges : earns

  quizzes ||--o{ user_quiz_attempts : used_in
  badges ||--o{ user_badges : awarded