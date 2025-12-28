from django.utils import timezone
from django.db.models import Prefetch
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Bookmark, Comment, Like, Post, Story
from .serializers import CommentSerializer, PostSerializer, StorySerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        base_queryset = (
            Post.objects.select_related('user__profile')
            .prefetch_related(
                Prefetch(
                    'comments',
                    queryset=Comment.objects.select_related('user__profile').order_by('created_at'),
                ),
                'likes',
                'shares',
                'bookmarks',
            )
        )

        username = self.request.query_params.get('username')
        user_id = self.request.query_params.get('user_id')

        if username:
            base_queryset = base_queryset.filter(user__username__iexact=username)
        if user_id:
            try:
                base_queryset = base_queryset.filter(user_id=int(user_id))
            except (TypeError, ValueError):
                base_queryset = base_queryset.none()

        return base_queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        Like.objects.get_or_create(user=request.user, post=post)
        return Response({'status': 'liked'})

    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        post = self.get_object()
        Like.objects.filter(user=request.user, post=post).delete()
        return Response({'status': 'unliked'})

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, post=post)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        post = self.get_object()
        # For now, just create a Share record. 
        # In a real app, this might create a new Post referencing the original, or send to DM.
        from .models import Share
        Share.objects.create(user=request.user, post=post)
        return Response({'status': 'shared'})

    @action(detail=True, methods=['post'])
    def bookmark(self, request, pk=None):
        post = self.get_object()
        Bookmark.objects.get_or_create(user=request.user, post=post)
        return Response({'status': 'bookmarked'})

    @action(detail=True, methods=['post'])
    def unbookmark(self, request, pk=None):
        post = self.get_object()
        Bookmark.objects.filter(user=request.user, post=post).delete()
        return Response({'status': 'unbookmarked'})

class StoryViewSet(viewsets.ModelViewSet):
    queryset = Story.objects.all()
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        now = timezone.now()
        Story.objects.filter(expires_at__lte=now).delete()
        base_queryset = Story.objects.filter(expires_at__gt=now).select_related('user__profile')
        user_id = self.request.query_params.get('user_id')
        if user_id:
            try:
                base_queryset = base_queryset.filter(user_id=int(user_id))
            except (TypeError, ValueError):
                base_queryset = base_queryset.none()
        return base_queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied('You can only delete your own stories.')
        super().perform_destroy(instance)


class BookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Post.objects.filter(bookmarks__user=self.request.user)
            .select_related('user__profile')
            .prefetch_related(
                Prefetch(
                    'comments',
                    queryset=Comment.objects.select_related('user__profile').order_by('created_at'),
                ),
                'likes',
                'shares',
                'bookmarks',
            )
            .order_by('-bookmarks__created_at')
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
