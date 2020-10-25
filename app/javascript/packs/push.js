<script>
    function push(){
        Push.create("更新情報",
        {
            body: "ブログの更新をお知らせします!",
            icon: 'casley_logo.png',
            timeout: 8000,
            onClick: function () {
                window.focus();
                this.close();
            }
        })
    }
</script>