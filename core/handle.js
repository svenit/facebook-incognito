let vm = new Vue({
    el: '#app',
    data: {
        currentTab: 0,
        tabs: [
            {
                title: 'Chức Năng',
            },
            {
                title: 'Fly Color',
            },
            {
                title: 'Giới Thiệu',
            }
        ],
        features:
        {
            blockSeenChat: {
                text: "Chặn 'Seen' Trong Chat",
                status: false,
                api: "https://www.facebook.com/ajax/mercury/change_read_status.php",
            },
            blockTypingChat: {
                text: "Chặn 'Typing' Trong Chat",
                status: false,
                api: "https://www.facebook.com/ajax/messaging/typ.php",
            },
            blockReceiveMessage: {
                text: "Ẩn Hoạt Động Trong Chat",
                status: false,
                api: "https://www.facebook.com/ajax/mercury/delivery_receipts.php",
            },
            blockNotification: {
                text: "Đánh Dấu Thông Báo Là Chưa Đọc",
                status: false,
                api: "https://www.facebook.com/ajax/notifications/mark_read.php",
            },
            blockSeenStory: {
                text: "Chặn 'Seen' Story",
                status: false,
                api: "storiesUpdateSeenStateMutation",
            },
            blockTypingComment: {
                text: "Chặn 'Typing' Trong Bình Luận",
                status: false,
                api: "UFI2LiveTypingBroadcastMutation_StartMutation"
            },
            stopTimeline: {
                text: "Tạm Dừng Newsfeed Timeline",
                status: false,
                api: "https://www.facebook.com/ajax/pagelet/generic.php/LitestandTailLoadPagelet"
            }
        },
        blocked: [],
        flyColor: {
            groupId: null,
            discordHook: null,
            facebookPostId: null,
            message: 'Blocked : {{ name }} | UID : {{ uid }} | Lí do : {{ reason }}',
            showReason: true
        },
    },
    methods: {
        setDefaultValue()
        {
            this.setFeature();
            this.setFlyColor();
        },
        setFeature()
        {
            let blocked = localStorage.getItem('blocked');
            if(blocked)
            {
                this.blocked = blocked.split(',');
                this.setBlocking();
                let properties = ['blockSeenChat', 'blockTypingChat', 'blockReceiveMessage', 'blockNotification', 'blockSeenStory', 'stopTimeline', 'blockTypingComment'];
                properties.forEach((item, key) => {
                    this.checkStatus(this.features[item]);
                });
            }
        },
        handleStatus(data)
        {
            let { status, api } = data;
            if(status)
            {
                if(!this.blocked.includes(api))
                {
                    this.blocked.push(api);
                }
                return this.setBlocking();
            }
            this.removeBlocked(api);
            return this.setBlocking();
        },
        checkStatus(data)
        {
            data.status = this.blocked.includes(data.api);
        },
        removeBlocked(api)
        {
            return this.blocked.filter((item, key) => {
                if(item == api)
                {
                    this.blocked.splice(key, 1);
                }
            });
        },
        setBlocking()
        {
            localStorage.setItem('blocked', this.blocked);
        },
        updateFlyColor()
        {
            localStorage.setItem('flyColorSetting', JSON.stringify(this.flyColor));
            alert('Cập nhật thành công');
        },
        setFlyColor()
        {
            let flyColorSetting = localStorage.getItem('flyColorSetting') || this.flyColor;
            this.flyColor = JSON.parse(flyColorSetting);
        }
    },
});

vm.setDefaultValue();