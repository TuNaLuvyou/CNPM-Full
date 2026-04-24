from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'full_name']
        read_only_fields = ['id']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return value

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        password = validated_data.pop('password')
        if 'username' not in validated_data or not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email', '').split('@')[0]

        user = User(**validated_data)
        user.set_password(password)
        parts = full_name.strip().split(' ', 1)
        user.first_name = parts[-1] if parts else ''
        user.last_name = parts[0] if len(parts) > 1 else ''
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Email hoặc mật khẩu không đúng.")

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            raise serializers.ValidationError("Email hoặc mật khẩu không đúng.")
        if not user.is_active:
            raise serializers.ValidationError("Tài khoản đã bị khoá.")

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source='settings.phone_number', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_number']

    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}".strip() or obj.username


class ProfileUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'current_password', 'new_password']

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu hiện tại không đúng.")
        return value

    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("Email này đã được sử dụng bởi người dùng khác.")
        return value

    def update(self, instance, validated_data):
        from .models import UserSettings
        full_name = validated_data.pop('full_name', None)
        phone_number = validated_data.pop('phone_number', None)
        new_password = validated_data.pop('new_password', None)
        validated_data.pop('current_password')

        instance.email = validated_data.get('email', instance.email)

        if full_name is not None:
            parts = full_name.strip().split(' ', 1)
            instance.first_name = parts[-1] if parts else ''
            instance.last_name = parts[0] if len(parts) > 1 else ''

        if new_password:
            instance.set_password(new_password)

        instance.save()

        if phone_number is not None:
            settings_obj, _ = UserSettings.objects.get_or_create(user=instance)
            settings_obj.phone_number = phone_number
            settings_obj.save()

        return instance


from .models import UserSettings, UserFavoriteCalendar


class UserSettingsSerializer(serializers.ModelSerializer):
    """
    Flat serializer — khớp 1-1 với model scalar columns.
    Frontend mapping (camelCase → snake_case):
        theme             ← theme
        language          ← language
        region            ← region
        dateFormat        ← date_format
        timeFormat        ← time_format
        firstDayOfWeek    ← first_day_of_week
        primaryTimezone   ← primary_timezone
        secondaryTimezone ← secondary_timezone
        showSecondaryTimezone ← show_secondary_timezone
        defaultLocation   ← default_location
        defaultMeetLink   ← default_meet_link
        notificationType  ← notification_type
        notificationMinutes ← notification_minutes
        showWeekends      ← show_weekends
        showCompletedTasks← show_completed_tasks
        showWeekNumbers   ← show_week_numbers
        showDeclinedEvents← show_declined_events
        dimPastEvents     ← dim_past_events
        weekStartDay      ← week_start_day
        phone_number      ← phone_number
    """
    # Backward-compatible API key used by frontend
    show_declined_events = serializers.BooleanField(source='show_declined', required=False)

    class Meta:
        model = UserSettings
        fields = [
            'theme', 'language', 'region', 'date_format', 'time_format', 'first_day_of_week',
            'primary_timezone', 'secondary_timezone', 'show_secondary_timezone',
            'default_location', 'default_meet_link',
            'notification_type', 'notification_minutes',
            'show_weekends', 'show_completed_tasks', 'show_week_numbers', 'show_declined', 'show_declined_events',
            'dim_past_events', 'week_start_day',
            'phone_number',
        ]


class UserFavoriteCalendarSerializer(serializers.ModelSerializer):
    """
    Serializer cho lịch yêu thích.
    Hỗ trợ cả preset (calendar_key) và CalendarGroup (calendar_group).
    """
    # Backward-compatible API key used by frontend
    cal_type = serializers.CharField(source='type', required=False)

    class Meta:
        model = UserFavoriteCalendar
        fields = ['id', 'type', 'cal_type', 'calendar_key', 'calendar_group', 'name', 'color', 'is_active', 'sort_order', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        # Phải có ít nhất 1 trong 2: calendar_key hoặc calendar_group
        if not data.get('calendar_key') and not data.get('calendar_group'):
            raise serializers.ValidationError(
                "Phải cung cấp calendar_key (preset) hoặc calendar_group (FK)."
            )
        return data
