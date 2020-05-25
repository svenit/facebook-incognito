let vm = new Vue({
    el: '#app',
    data: {
        loading: false,
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
            facebookPostFeedbackId: null,
            message: 'Blocked : {{ name }} | UID : {{ uid }} | Lí do : {{ reason }}',
            showReason: true,
            banForever: false
        },
        alert: {
            status: null,
            show: false,
            message: null
        }
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
            this.showAlert('Cập nhật thành công', 'success');
        },
        setFlyColor()
        {
            let flyColorSetting = localStorage.getItem('flyColorSetting') || this.flyColor;
            this.flyColor = JSON.parse(flyColorSetting);
        },
        async connectToFacebook()
        {
            let actor = JSON.parse(localStorage.getItem('actor'));              
            let message;
            if(actor) 
            {
                if(this.flyColor.facebookPostId.trim())
                {
                    this.loading = true;
                    let option = {
                        fb_dtsg_ag: actor.fb_dtsg,
                        fb_dtsg: actor.fb_dtsg,
                    }
                    let { data } = await axios.post(`${API_URL}?action=get-feedback-id`, {
                        option, 
                        cookie: actor.cookie,
                        setting: this.flyColor
                    });
                    if(data) 
                    {
                        this.flyColor.facebookPostFeedbackId = data;
                        message = {
                            text: `Đã kết nối đến Facebook, giờ đây bạn có thể xem logs tại https://facebook.com/${this.flyColor.facebookPostId}`,
                            status: 'success'
                        };
                    }
                    else 
                    {
                        this.flyColor.facebookPostId = null;
                        this.flyColor.facebookPostFeedbackId = null;
                        message = {
                            text: 'Không tìm thấy bài viết này',
                            status: 'danger'
                        };
                    };
                    this.loading = false;
                    this.showAlert(message.text, message.status);
                    return;
                }
                return;
            }
            this.showAlert('Phiên đã hết hạn! Vui lòng truy cập vào Facebook để tiếp tục', 'danger');
        },
        async connectToDiscord()
        {
            this.loading = true;
            try
            {
                if(this.flyColor.discordHook.trim())
                {
                    await axios.post(`${this.flyColor.discordHook}`, {
                        content: "``Connected to Discord Webhook - Facebook Incognito Chrome Extension was powered by Sven``",
                    });
                    this.showAlert('Kết nối đến Webhook Discord thành công', 'success');
                }
            }
            catch(e)
            {
                this.flyColor.discordHook = null;
                this.showAlert('Không thể kết nối đến Webhook Discord', 'danger');
            }
            this.loading = false;
        },

        showAlert(message, status, time = 5000)
        {
            this.alert = {
                show: true,
                message,
                status
            };
            setTimeout(() => {
                this.alert.show = false;
            }, time);
        }
    },
});

vm.setDefaultValue();