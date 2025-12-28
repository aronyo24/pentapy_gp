from datetime import timedelta

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Bookmark, Comment, Like, Post, Story

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']

    def get_avatar(self, obj):
        try:
            profile = obj.profile
        except Exception:
            profile = None
        avatar_field = getattr(profile, 'avatar', None)
        if not avatar_field:
            return None

        request = self.context.get('request')
        url = avatar_field.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'text', 'created_at']
        read_only_fields = ['user', 'created_at', 'post']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    bookmarks_count = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    video = serializers.FileField(required=False, allow_null=True)
    comments = CommentSerializer(many=True, read_only=True, source='comments.all') # Or use a method field to limit

    class Meta:
        model = Post
        fields = [
            'id',
            'user',
            'image',
            'video',
            'caption',
            'created_at',
            'likes_count',
            'comments_count',
            'shares_count',
            'bookmarks_count',
            'is_liked',
            'is_bookmarked',
            'comments',
        ]
        read_only_fields = ['user', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_shares_count(self, obj):
        return obj.shares.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_bookmarks_count(self, obj):
        return obj.bookmarks.count()

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def validate(self, attrs):
        image = attrs.get('image')
        video = attrs.get('video')
        if not image and not video and self.instance is None:
            raise serializers.ValidationError('Provide an image or a video for this post.')
        if image and video:
            raise serializers.ValidationError('Please upload either an image or a video, not both.')
        return super().validate(attrs)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')

        image_field = getattr(instance, 'image', None)
        if image_field and data.get('image'):
            url = image_field.url
            data['image'] = request.build_absolute_uri(url) if request is not None else url
        elif not image_field:
            data['image'] = None

        video_field = getattr(instance, 'video', None)
        if video_field and data.get('video'):
            url = video_field.url
            data['video'] = request.build_absolute_uri(url) if request is not None else url
        else:
            data['video'] = None
        return data

class StorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    expires_at = serializers.DateTimeField(required=False)

    class Meta:
        model = Story
        fields = ['id', 'user', 'image', 'created_at', 'expires_at']
        read_only_fields = ['user', 'created_at']

    def validate_expires_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Expiration must be in the future.")
        return value

    def create(self, validated_data):
        expires_at = validated_data.get('expires_at')
        if not expires_at:
            validated_data['expires_at'] = timezone.now() + timedelta(hours=24)
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        image_field = getattr(instance, 'image', None)
        if image_field and data.get('image'):
            request = self.context.get('request')
            url = image_field.url
            data['image'] = request.build_absolute_uri(url) if request is not None else url
        return data
