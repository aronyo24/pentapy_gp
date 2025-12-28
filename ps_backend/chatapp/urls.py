from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ChatContactViewSet, ConversationViewSet, MessageViewSet

router = DefaultRouter()
router.register('conversations', ConversationViewSet, basename='conversation')
router.register('messages', MessageViewSet, basename='message')
router.register('contacts', ChatContactViewSet, basename='chat_contact')

urlpatterns = [
    path('', include(router.urls)),
]