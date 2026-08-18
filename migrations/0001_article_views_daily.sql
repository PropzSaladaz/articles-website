CREATE TABLE IF NOT EXISTS article_views_daily (
  article_slug TEXT NOT NULL,
  day TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_slug, day)
);

CREATE INDEX IF NOT EXISTS idx_article_views_daily_day
  ON article_views_daily (day);
