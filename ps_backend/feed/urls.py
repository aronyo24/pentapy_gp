from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookmarkViewSet, PostViewSet, StoryViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'stories', StoryViewSet)
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

urlpatterns = [
    path('', include(router.urls)),
]
