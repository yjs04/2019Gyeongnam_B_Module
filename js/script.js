class App{
    static ls = localStorage;
    static save(key,val){return App.ls.setItem(key,JSON.stringify(val))}
    static load(key) {return App.ls.getItem(key) || false}

    constructor(){
        this.Event();
        this.playList = [];
        this.Q = new queue();
        this.buttonstatus();
        this.PageLoad();
    }

    musicgenre(array){
        this.mainList = ["추천 노래"];
        let check = 0;
        array.forEach(element => {
            check = 0;
            this.mainList.forEach(item =>{
                if(element['genre'] == item) check = 1;
            });
            if(!check) this.mainList[this.mainList.length] = element['genre'];
        });
        
        this.mainList.forEach(element => {
            let title = element;
            if(element == "") title = "기타";
            let list =`
            <!-- music area-->
                <div class="music_list_area">
                    <h4 class="music_list_area_title">${title}</h4>
                    <div class="music_list_area_box">
                        <!-- music_list_area_box-->
                    `;
                    if(element == "추천 노래") for(let i = 0; i<5;i++)list +=  this.createMusic(array[i]);
                    else 
                    {
                        let count = 0;
                        array.forEach(music =>{
                            if(count < 5 && music['genre'] == element){
                                count++;
                                list += this.createMusic(music);
                            }
                        });
                    }
                    list+=`
                    </div>
                </div>
            `;
            document.querySelector("#music_list").innerHTML += list;
        });
    }

    buttonstatus(){
        window.addEventListener("click",(e)=>{
            if(e.target.id == "music_play_repeat" || (e.target.parentNode && e.target.parentNode.id == "music_play_repeat")) this.MusicRepeat();
            if(e.target.id == "music_play_start" || (e.target.parentNode && e.target.parentNode.id == "music_play_start") ) this.musicPlay();
            if(e.target.id == "music_play_last" || (e.target.parentNode && e.target.parentNode.id == "music_play_last") ) this.musicLast();
            if(e.target.id == "music_play_next" || (e.target.parentNode && e.target.parentNode.id == "music_play_next")) this.musicNext();

            if(e.target.classList.contains("music_list_button") || (e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("music_list_button"))) this.musicPlayButton(e.target.getAttribute("data-id"));
        });
        switch(JSON.parse(App.load("repeat_status"))){
            case 1 :document.querySelector("#music_play_repeat p").innerText = "노래반복"; break;
            case 2 :document.querySelector("#music_play_repeat p").innerText = "대기열 반복"; break;
            default :document.querySelector("#music_play_repeat p").innerText = "반복안함"; break;
        }
    }

    PageLoad(){
        if(document.querySelector("#Library_playlist_content")) this.LibrarySet();
        if(document.querySelector("#music_list") && JSON.parse(App.load("music_list")) !== false) this.musicgenre(JSON.parse(App.load("music_list")));
        if(document.querySelector("#playlist_music") && document.querySelector("#playlist_music").classList.contains("queue")) this.Q.createMusic();
    }

    loadMusic(){
        return new Promise(res => {
            let data = App.load("music_list");
            if(data) res(JSON.parse(data));
            else {
                fetch("json/music_list.json")
                .then(data => data.json())
                .then(async data => {
                    this.musicList = await Promise.all(data.map(async x => {
                                        x.duration = await this.getDuration(x.url);
                                        return x;
                                    }));
                    App.save("music_list", data);
                    res(data); 
                    this.musicgenre(JSON.parse(App.load("music_list")));
                });
            }
        });
    }

    getDuration(filename){
        return new Promise(res => {
            fetch("music/"+filename)
            .then(data => data.arrayBuffer())
            .then(data => {
                new AudioContext().decodeAudioData(data).then(value => res(value.duration));
            });
        });
    }

    Event(){
        if(JSON.parse(App.load("music_list")) == false) this.loadMusic();

        window.addEventListener('contextmenu', function() {event.preventDefault();});

        window.addEventListener('mousedown', (e)=>{
          if ((e.button == 2) || (e.which == 3)) {
            if(document.querySelector("#RightMenu")) document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
            
            if(document.querySelector("#queue_content")){
                if(e.target.classList.contains("playlist_music") || ( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music")) || ( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music")) ){
                    let idx;
                    if(( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.id.split("_")[1]);
                    if(( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.parentNode.id.split("_")[1]);
                    let item = `
                    <button class="RightMenuBtn RightMenu" id="add_playlist" value = "${idx}">플레이리스트에 추가</button>
                    <button class="RightMenuBtn RightMenu" id="remove_wating" value = "${idx}">대기열에서 삭제</button>`;
                    this.RightMenuMake(item,e);
                }
            }

            if(e.target.classList.contains("music_list_area_music_hover")){
                let item = `
                <button class="RightMenuBtn RightMenu" id="add_playlist" value = "${Number(e.target.id.split("_")[1])}">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play" value = "${Number(e.target.id.split("_")[1])}">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="add_wating" value = "${Number(e.target.id.split("_")[1])}">대기열에 추가</button>
                `;
                this.RightMenuMake(item,e);
            }

            if(e.target.id == "play_now_list_area"){
                let item = `
                <button class="RightMenuBtn RightMenu" id="play_remove">재생기록 삭제</button>
                <button class="RightMenuBtn RightMenu" id="add_playlist">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="add_wating">대기열에 추가</button>
                `;
                this.RightMenuMake(item,e);
            }

            if(e.target.classList.contains("Library_playlist_box_hover")){
                let item = `
                <button class="RightMenuBtn RightMenu" id="play_playlist" data-id = "${Number(e.target.id.split("_")[1])}">플레이리스트 재생</button>
                <button class="RightMenuBtn RightMenu" id="playlist_addPlaylist" data-id = "${Number(e.target.id.split("_")[1])}">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play_PlayList" data-id = "${Number(e.target.id.split("_")[1])}">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="playList_addWating" data-id = "${Number(e.target.id.split("_")[1])}">대기열에 추가</button>
                <button class="RightMenuBtn RightMenu" id="remove_playlist" data-id = "${Number(e.target.id.split("_")[1])}">플레이리스트 삭제</button>
                `;
                this.RightMenuMake(item,e);
            }

            if(document.querySelector("#playlist_content")){
                let check = (e.target.className && e.target.classList.contains("playlist_music") ) || (e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("playlist_music")) || (e.target.parentNode.parentNode && e.target.parentNode.parentNode.className && e.target.parentNode.parentNode.classList.contains("playlist_music"));
                if(check){
                    let data,num;
                    if((e.target.className && e.target.classList.contains("playlist_music") )){
                        data = parseInt(e.target.getAttribute("data-id"));
                        num = parseInt(e.target.getAttribute("data-num"));
                    }
                    else if((e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("playlist_music"))){
                        data = parseInt(e.target.parentNode.getAttribute("data-id"));
                        num = parseInt(e.target.parentNode.getAttribute("data-num"));
                    }
                    else if((e.target.parentNode.parentNode && e.target.parentNode.parentNode.className && e.target.parentNode.parentNode.classList.contains("playlist_music"))){
                        data = parseInt(e.target.parentNode.parentNode.getAttribute("data-id"));
                        num = parseInt(e.target.parentNode.parentNode.getAttribute("data-num"));
                    }
                    else{
                        data =false;
                        num = false;
                    }
                    let list = document.querySelector("#playlist_music").getAttribute("data-id");
                    let item = `
                    <button class="RightMenuBtn RightMenu" id="add_playlist" value = "${data}">플레이리스트에 추가</button>
                    <button class="RightMenuBtn RightMenu" id="next_play" value = "${data}">다음 음악으로 재생</button>
                    <button class="RightMenuBtn RightMenu" id="add_wating" value = "${data}">대기열에 추가</button>
                    <button class="RightMenuBtn RightMenu" id="music_remove_playlist" data-num="${num}" data-playlist = "${list}" value = "${data}">플레이리스트에서 삭제</button>
                    `;
                    if(data !== false) this.RightMenuMake(item,e);
                }
            }
          }
        });

        window.addEventListener("click",(e)=>{
            if(e.target.id == "music_play_text_open" || e.target.id == "music_play_text_open_icon") this.open_musicText();
            if(document.querySelector("#RightMenu") && !e.target.classList.contains('RightMenu') && !e.target.classList.contains("playListMenu_box")){
                if((!e.target.classList.contains("playListMenuBtn") &&!e.target.classList.contains("playListMenuCheck")) && (!e.target.classList.contains("playListMenuBtn") &&!e.target.classList.contains("PlayListCheck")) ){
                    if(document.querySelector("#playlistMenu")) document.querySelector("body").removeChild(document.querySelector("#playlistMenu"));
                    document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                } 
            }
            if(document.querySelector("#add_wating") && e.target.id == "add_wating"){
                let list = [];
                if(App.load("queue_list")) list = JSON.parse(App.load("queue_list"));
                list.push(Number(document.querySelector("#add_wating").value));
                App.save("queue_list",list);
                App.save("max_queue",list.length - 1);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
            }

            if(document.querySelector("#add_playlist") && e.target.id == "add_playlist") this.AddPlayList(e.target.value);

            if(document.querySelector("#next_play") && e.target.id == "next_play") this.nextPlay(e.target.value);

            if(document.querySelector("#music_remove_playlist") && e.target.id == "music_remove_playlist"){
                let list_num = e.target.getAttribute("data-playlist");
                let playList = JSON.parse(App.load("play_list")),num = parseInt(e.target.getAttribute("data-num"));
                playList[list_num]['list'].splice(num,1);
                playList[list_num]['num']--;
                App.save("play_list",playList);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                document.querySelector("#playlist_music").innerHTML = "";
                document.querySelector("#playlist_info").innerHTML = `
                <p id="playlist_title"></p>
                <p id ="playlist_musicnum"></p>
                `;
                this.PlayListPageSet(list_num);
            }

            if(e.target.id == "remove_wating"){
                let remove_idx = Number(document.querySelector("#remove_wating").value);
                let list = [];
                list = JSON.parse(App.load("queue_list"));
                list.splice(list.indexOf(remove_idx),1);
                App.save("queue_list",list);
                App.save("max_queue",list.length - 1);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                this.Q.createMusic();
            }

            if(document.querySelector("#queue_content")){
                if(e.target.classList.contains("playlist_music") || ( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music")) || ( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music")) ){
                    let idx;
                    if(e.target.classList.contains("playlist_music")) idx = parseInt(e.target.getAttribute("data-num"));
                    if(( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.getAttribute("data-num"));
                    if(( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.parentNode.getAttribute("data-num"));
                    App.save("now_queue",idx);
                    document.querySelector("#music_play_start").setAttribute("data-id",1);
                    this.musicPlay();
                }
            }

            if((e.target.classList.contains("Library_playlist_box_hover_btn") || (e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("Library_playlist_box_hover_btn"))) || (e.target.id == "play_playlist") || (e.target.id == "playlist_all_play") || (e.target.classList.contains("playlist_play_icon"))){
                let idx;
                if((e.target.parentNode && e.target.parentNode.classList.contains("Library_playlist_box_hover_btn")) || (e.target.classList.contains("playlist_play_icon"))) idx = Number(e.target.parentNode.getAttribute("data-id"));
                else idx = Number(e.target.getAttribute("data-id"));
                
                let list = JSON.parse(App.load("play_list"))[idx];
                App.save("queue_list",list['list']);
                App.save("max_queue",parseInt(list['num'])-1);
                App.save("now_queue",0);
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                if(document.querySelector("#RightMenu")) document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                this.musicPlay();
            }

            if( (e.target.id == "next_play_PlayList") || (e.target.id == "playlist_next_add") || (e.target.classList.contains("playlist_next_add_icon")) ){
                let idx;
                if((e.target.classList.contains("playlist_next_add_icon"))) idx = e.target.parentNode.getAttribute("data-id");
                else idx = e.target.getAttribute("data-id");
                if(idx !== null){
                    let queue_list = JSON.parse(App.load("queue_list"));
                    let max_num = JSON.parse(App.load("max_queue"));
                    let list = JSON.parse(App.load("play_list"))[idx];
                    let now_queue = JSON.parse(App.load("now_queue"));
                    list['list'].forEach((item,id) =>{
                        queue_list.splice((id+now_queue+1),0,item);
                    });
                    App.save("queue_list",queue_list);
                    App.save("max_queue",max_num + list['num']);
                    if(document.querySelector("#RightMenu")) document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                }
            }

            if(e.target.id == "playList_addWating"){
                let idx = e.target.getAttribute("data-id");
                let queue_list = JSON.parse(App.load("queue_list"));
                let max_num = JSON.parse(App.load("max_queue"));
                let list = JSON.parse(App.load("play_list"))[idx];
                list['list'].forEach(item =>{
                    queue_list.push(item);
                });

                App.save("queue_list",queue_list);
                App.save("max_queue",max_num + list['num']);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
            }

            if(e.target.id == "remove_playlist"){
                let idx = e.target.getAttribute("data-id");
                let playList = JSON.parse(App.load("play_list"));
                playList.splice(idx,1);
                App.save("play_list",playList);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                document.querySelector("#Library_playlist_content").innerHTML = "";
                this.LibrarySet();
            }

            if(e.target.id == "playlist_addPlaylist"){
                let id = e.target.getAttribute("data-id");
                let playList = JSON.parse(App.load("play_list"))[id];

                if(document.querySelector("#RightMenu")){
                    let list = JSON.parse(App.load("play_list"));
                    let Box = document.createElement("div");
                    Box.id = "playlistMenu";
                    if(list){
                        let checked = "",disabled = "";
                        list.forEach((item,idx)=>{
                            checked = id == idx ? "checked" : "";
                            if(checked == ""){
                                let cc = 1;
                                playList['list'].forEach(value =>{
                                    let c = item['list'].findIndex((el) => value == el);
                                    cc = c == -1 ? 0 : cc;
                                });
                                checked = cc == 1 ? "checked" : "";
                            }
                            disabled = id == idx ? "disabled" : "";
                            Box.innerHTML += `<div class = 'playListMenu_box'>
                            <input type="checkbox" id="list_${idx}" class = "PlayListCheck" data-id = "${idx}" data-num = "${id}" ${checked} ${disabled}>
                            <label for="list_${idx}" class='playListMenuBtn' id='play_${idx}'>${item['name']}</label>
                            </div>`;
                        });
                    }
                    Box.innerHTML += `<button class="playListMenuNew">새 재생목록</button><button class="playListMenuOut">닫기</button>`;
                    document.querySelector("body").appendChild(Box);
                    Box.style.left = parseInt($("#RightMenu").css("left")) + 200 + "px";
                    Box.style.top = $("#RightMenu").css("top");
                }
            }

            if(e.target.classList.contains("Library_playlist_box_hover")){
                let href = "playlist.html";
                history.pushState({data:""},null,href);
                fetch(href)
                    .then(v => v.text())
                    .then(v => {
                        let reg = /<!--\scontent-->[^]+<div\sid="content">([^]*)<\/div>[^]+<!--\sendcontent-->/;
                        if(reg.exec(v)){
                            let content = reg.exec(v)[1];
                            document.querySelector("#content").innerHTML = content;
                            let loading = document.createElement("div");
                            loading.id = "Loading";
                            loading.innerHTML = `<div class="loading_circle"></div>`;
                            document.querySelector("body").appendChild(loading);
                            setTimeout(()=>{
                                document.querySelector("body").removeChild(document.querySelector("#Loading"));
                                this.PlayListPageSet(Number(e.target.id.split("_")[1]));
                            },500);
                        }
                    });
            }

            if(e.target.classList.contains("playlist_hover_start") || e.target.classList.contains("playlist_hover_start_icon")){
                let id = parseInt(e.target.getAttribute("data-id"));
                App.save("queue_list",[id]);
                App.save("now_queue",0);
                App.save("max_queue",0);
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                this.musicPlay();
            }

        });
        
        document.querySelector("#music_play_volum").addEventListener("input",()=>{
            document.querySelector("#music_play_volum_value").innerText = `${document.querySelector("#music_play_volum").value}%`;
            document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
        });

        document.querySelector("#music_prograss_bar").addEventListener("input",()=>{
            if(document.querySelector("#music_audio").duration){
                document.querySelector("#music_audio").currentTime = document.querySelector("#music_prograss_bar").value;
            }
        });

        window.addEventListener("change",(e)=>{

            if(e.target.classList.contains("playListMenuCheck")){
                let item = Number(e.target.getAttribute("data-id"));
                let list = JSON.parse(App.load("play_list"));
                let id = Number(e.target.getAttribute("data-num"));
                if(e.target.checked){
                    if(list[item]['list'].indexOf(Number(id)) == -1){
                        list[item]['list'].push(Number(id));
                        list[item]['num'] = list[item]['list'].length;
                        App.save("play_list",list);
                    }
                }else{
                    if(list[item]['list'].indexOf(Number(id)) !== -1){
                        let ix = list[item]['list'].indexOf(Number(id));
                        list[item]['list'].splice(ix,1);
                        list[item]['num'] = list[item]['list'].length;
                        App.save('play_list',list);
                    }
                }
            }

            if(e.target.classList.contains("PlayListCheck")){
                let item = parseInt(e.target.getAttribute("data-id"));
                let list =JSON.parse(App.load("play_list"));
                let id = parseInt(e.target.getAttribute("data-num"));
                if(e.target.checked){
                    list[id]['list'].forEach(value =>{list[item]['list'].push(value);});
                    list[item]['num'] += parseInt(list[id]['num']);
                    App.save("play_list",list);
                }else{
                    list[id]['list'].forEach(value =>{
                        let i = list[item]['list'].lastIndexOf(parseInt(value));
                        list[item]['list'].splice(i,1);
                    });
                    list[item]['num'] -= parseInt(list[id]['num']);
                    App.save("play_list",list);
                }
            }
        });
    }

    LibrarySet(){
        let list = JSON.parse(App.load("play_list"));
        if(list !== false){
            list.forEach((item,idx) =>{
                document.querySelector("#Library_playlist_content").innerHTML+=this.LibraryPlayList(item,idx);
            });
        }
    }

    LibraryPlayList(item,idx){
        let list = JSON.parse(App.load("music_list"));
        let img = item['num'] == 0 ? "" : 'image/'+list[item['list'][0]]['albumImage']; 
        let box = `
        <div class="Library_playlist_box">
            <div class="Library_playlist_box_hover" id="playlist_${idx}">
                <button class="Library_playlist_box_hover_btn" data-id="${idx}">
                    <i class="fa fa-play play"></i>
                </button>
            </div>
            <img src="${img}" alt="playlist_title_img" class="Library_playlist_title_img">
            <div class="Library_playlist_info">
                <p class="Library_playlist_title">${item['name']}</p>
                <p class="Library_playlist_musicNum"> 총 ${item['num']}곡</p>
            </div>
        </div>
        `;
        return box;
    }

    AddPlayList(id){
        if(document.querySelector("#RightMenu")){
            let list = JSON.parse(App.load("play_list"));
            let Box = document.createElement("div");
            Box.id = "playlistMenu";
            if(list){
                let checked = "";
                list.forEach((item,idx)=>{
                    checked = item['list'].find(e => e == id) == undefined ? "" : "checked";
                    Box.innerHTML += `<div class = 'playListMenu_box'>
                    <input type="checkbox" id="list_${idx}" class = "playListMenuCheck" data-id = "${idx}" data-num = "${id}" ${checked}>
                    <label for="list_${idx}" class='playListMenuBtn' id='play_${idx}'>${item['name']}</label>
                    </div>`;
                });
            }
            Box.innerHTML += `<button class="playListMenuNew">새 재생목록</button><button class="playListMenuOut">닫기</button>`;
            document.querySelector("body").appendChild(Box);
            Box.style.left = parseInt($("#RightMenu").css("left")) + 200 + "px";
            Box.style.top = $("#RightMenu").css("top");
        }

        document.querySelector(".playListMenuOut").addEventListener("click",()=>{
            document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
            document.querySelector("body").removeChild(document.querySelector("#playlistMenu"));
        });

        document.querySelector(".playListMenuNew").addEventListener("click",()=>{
            let name = prompt("재생목록의 이름을 설정해주세요");
            if(name !== null){
                let list = JSON.parse(App.load("play_list"));
                list = list == false ? [] : list;
                let item = {"name":name,"list":[Number(id)],"num":1}
                list.push(item);
                App.save("play_list",list);
            }
        });
    }

    async PlayListPageSet(id){
        let list = JSON.parse(App.load("play_list"))[id];
        if(id !== null && list){
            
            document.querySelector("#playlist_title").innerHTML = list['name'];
            document.querySelector("#playlist_musicnum").innerHTML = `총 ${list['num']}곡`;
            document.querySelector("#playlist_info").innerHTML +=`
            <button data-id="${id}" id="playlist_all_play"><i class="fa fa-play play playlist_play_icon"></i></button>
            <button data-id="${id}" id="playlist_next_add"><i class="fa fa-plus playlist_next_add_icon"></i></button>
            `;
            document.querySelector("#playlist_music").setAttribute("data-id",id);
            for(let i = 0; i<list['list'].length; i++){
                let music_list = JSON.parse(App.load("music_list"))[list['list'][i]];
                await this.playListBox(music_list,i);
            }
            
        }
    }

    playListBox(music_list,idx){
        let box = document.createElement("div");
        box.classList.add("playlist_music");
        box.setAttribute("data-num",idx);
        box.setAttribute("data-id",music_list['idx']);
        box.innerHTML += `
            <img src="image/${music_list['albumImage']}" alt="cover">
            <div class="playlist_music_info">
                <p class="playlist_music_title">${music_list['name']}</p>
                <p class="playlist_music_artist">${music_list['artist']}</p>
                <p class="playlist_music_time">${this.Q.changeTime(music_list['duration'])}</p>
            </div>
            <div class="playlist_cover_hover">
                <button class="playlist_hover_start" data-id="${music_list['idx']}"><i class="fa fa-play playlist_hover_start_icon" data-id="${music_list['idx']}"></i></button>
            </div>
            `;
        document.querySelector("#playlist_music").appendChild(box);
    }

    playlistcalltime(music_list,time){
        let box = document.createElement("div");
        box.classList.add("playlist_music");
        box.setAttribute("data-id",music_list['idx']);
        box.innerHTML += `
            <img src="image/${music_list['albumImage']}" alt="cover">
            <div class="playlist_music_info">
                <p class="playlist_music_title">${music_list['name']}</p>
                <p class="playlist_music_artist">${music_list['artist']}</p>
                <p class="playlist_music_time">${time}</p>
            </div>`;
        document.querySelector("#playlist_music").insertBefore(box,document.querySelector("#playlist_music").firstChild);
        document.querySelector("body").removeChild(document.querySelector("#music_time"));
    }

    nextPlay(idx){
        let list = [];
        if(App.load("queue_list")) list = JSON.parse(App.load("queue_list"));

        let now_idx = JSON.parse(App.load("now_queue"));
        now_idx = now_idx == false ? 0 : now_idx;
        list.splice(now_idx + 1,0,Number(idx));
        App.save("max_queue",now_idx + 1);
        App.save("queue_list",list);
        
        document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
    }

    musicPlayButton(idx){
        App.save("now_queue",0);
        App.save("queue_list",[Number(idx)]);
        App.save("max_queue",0);
        document.querySelector("#music_play_start").setAttribute("data-id",1);
        this.musicPlay();
    }

    musicLast(){
        let now_idx = JSON.parse(App.load("now_queue")),max_idx = JSON.parse(App.load("max_queue"));
        let music_idx = JSON.parse(App.load("queue_list"));
        let music = JSON.parse(App.load("music_list"))[music_idx[now_idx]];
        if(document.querySelector("#music_audio").getAttribute("src") == "music/"+music['url']){
            if(document.querySelector("#music_audio").currentTime >= 5) document.querySelector("#music_audio").currentTime = 0;
            else{
                now_idx = now_idx == 0 ? 0 : now_idx - 1;
                App.save("now_queue",now_idx);
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                document.querySelector("#music_audio").currentTime = 0;
                this.musicPlay();
            }
        }
    }

    musicNext(){
        let now_idx = JSON.parse(App.load("now_queue")),max_idx = JSON.parse(App.load("max_queue"));
        let music_idx = JSON.parse(App.load("queue_list"));
        let music = JSON.parse(App.load("music_list"))[music_idx[now_idx]];
        if(document.querySelector("#music_audio").getAttribute("src") == "music/"+music['url']){
            if(JSON.parse(App.load("repeat_status")) == 2) now_idx = now_idx == max_idx ? 0 : now_idx + 1;
            else now_idx = now_idx == max_idx ? max_idx : now_idx + 1;
            App.save("now_queue",now_idx);
            document.querySelector("#music_play_start").setAttribute("data-id",1);
            this.musicPlay();
        }
    }

    MusicRepeat(){
        switch(JSON.parse(App.load("repeat_status"))){
            case 1 : App.save("repeat_status",2); document.querySelector("#music_play_repeat p").innerText = "대기열 반복"; break;
            case 2 : App.save("repeat_status",0); document.querySelector("#music_play_repeat p").innerText = "반복안함"; break;
            default : App.save("repeat_status",1); document.querySelector("#music_play_repeat p").innerText = "노래반복"; break;
        }
    }

    open_musicText(){
        if(document.querySelector("#music_play_text_area").classList.contains("open")){
            document.querySelector("#music_play_text_area").classList.remove("open");
            document.querySelector("#music_play_text_open_icon").classList.remove("open");
        }else{
            document.querySelector("#music_play_text_area").classList.add("open");
            document.querySelector("#music_play_text_open_icon").classList.add("open");
        }
    }

    musicPlay(){
        if(Number(document.querySelector("#music_play_start").getAttribute("data-id"))){
            let now_num = JSON.parse(App.load("now_queue")) !== false ? JSON.parse(App.load("now_queue")) : 0;
            let music_idx = JSON.parse(App.load("queue_list"));
            let music = JSON.parse(App.load("music_list"))[music_idx[now_num]];
            if(music_idx){
                if(document.querySelector("#music_audio").getAttribute("src") !== "music/"+music['url']){
                    document.querySelector("#music_audio").setAttribute("src","music/"+music['url']);
                    document.querySelector("#music_audio").onloadeddata = ()=>{
                        document.querySelector("#music_audio").play();
                        document.querySelector("#music_play_cover").innerHTML = `<img src='image/${music['albumImage']}'>`
                        document.querySelector("#music_play_start").innerHTML = `<i class="fa fa-pause pause"></i>`;
                        document.querySelector("#music_play_title").innerHTML = `${music['name']}`;
                        document.querySelector("#music_play_artist").innerHTML = `${music['artist']}`;
                        document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
                        document.querySelector("#music_play_start").setAttribute("data-id",0);
                        document.querySelector("#music_prograss_bar").setAttribute("max",music['duration']);
                        this.musiclyrics();
                        requestAnimationFrame(()=>{this.frame();});
                        this.musicReset = 0;
                    }
                }else{
                    document.querySelector("#music_audio").play();
                    document.querySelector("#music_play_cover").innerHTML = `<img src='image/${music['albumImage']}'>`
                    document.querySelector("#music_play_start").innerHTML = `<i class="fa fa-pause pause"></i>`;
                    document.querySelector("#music_play_title").innerHTML = `${music['name']}`;
                    document.querySelector("#music_play_artist").innerHTML = `${music['artist']}`;
                    document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
                    document.querySelector("#music_play_start").setAttribute("data-id",0);
                    this.musiclyrics();
                    requestAnimationFrame(()=>{this.frame();});
                    this.musicReset = 0;
                }
            }
        }else{
            document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
            document.querySelector("#music_play_start").innerHTML = `<i class="fa fa-play play"></i>`;
            document.querySelector("#music_audio").pause();
            document.querySelector("#music_play_start").setAttribute("data-id",1);
        }
    }

    RightMenuMake(item,e){
        let menu = document.createElement("div");
        menu.id = "RightMenu";
        menu.classList.add("RightMenu");
        menu.style.top = e.pageY+"px";
        menu.style.left = e.pageX+"px";
        menu.style.zIndex = 100000000000000;
        document.querySelector("body").appendChild(menu);
        document.querySelector("#RightMenu").innerHTML = item;
    }

    frame(){
        this.Q.QueueNowMusic();
        let now_time = document.querySelector("#music_audio").currentTime,Atime = document.querySelector("#music_audio").duration;
        document.querySelector("#music_play_all").innerText = this.Q.changeTime(document.querySelector("#music_audio").duration);
        document.querySelector("#music_play_now").innerText = this.Q.changeTime(now_time);
        this.Q.lyricsTime();
        document.querySelector("#music_prograss_bar").value = now_time;
        if(now_time >= Atime && !this.musicReset) {
            let now_queue = JSON.parse(App.load("now_queue")),max_queue = JSON.parse(App.load("max_queue"));
            if(max_queue == now_queue && JSON.parse(App.load("repeat_status")) == 0) return;
            else if(JSON.parse(App.load("repeat_status")) !== 1) now_queue = now_queue >= max_queue ? 0 : now_queue + 1;
            App.save("now_queue",now_queue);
            document.querySelector("#music_play_start").setAttribute("data-id",1);
            this.musicReset = 1;
            document.querySelector("#music_play_start").setAttribute("data-id",1);
            this.musicPlay();
        }
        requestAnimationFrame(()=>{
            this.frame();
        });
    }

    musiclyrics(){
        let now_idx = JSON.parse(App.load("now_queue")),music_list = JSON.parse(App.load("music_list")),queue_list = JSON.parse(App.load("queue_list"));
        let now_lyrics = music_list[queue_list[now_idx]],textArea = document.querySelector("#music_play_text_area");
        textArea.innerHTML = `<h2>${now_lyrics['name']} <br> <span>${now_lyrics['artist']}</span></h2>`;
        if(now_lyrics['lyrics'] == null){
            textArea.innerHTML += `<p>가사가 없습니다.</p>`;
        }else{
            fetch("/lyrics/"+now_lyrics['lyrics'])
                .then(v => v.text())
                .then(v =>{
                    let reg = /[0-9]+\n(?<time>.+)\n(?<lyrics>.+)/;
                    while(reg.test(v)){
                        let stime = 0,etime = 0;
                        let timeReg = /(?<hour>[0-9]{2}):(?<min>[0-9]{2}):(?<sec>[0-9]{2}),(?<ms>[0-9]+)\s-->\s(?<endhour>[0-9]{2}):(?<endmin>[0-9]{2}):(?<endsec>[0-9]{2}),(?<endms>[0-9]+)/;
                        let time = reg.exec(v).groups['time'],ly = reg.exec(v).groups['lyrics'];
                        if(timeReg.test(time)){
                            let timeG = timeReg.exec(time).groups;
                            stime = (timeG['hour'] * 3600) + (timeG['min'] * 60) + Number(timeG['sec']) + (timeG['ms'] / 1000);
                            etime = (timeG['endhour'] * 3600) + (timeG['endmin'] * 60) + Number(timeG['endsec']) + (timeG['endms'] / 1000);
                            etime = etime == 0 ? document.querySelector("#music_audio").duration : etime;
                        }
                        textArea.innerHTML += `<p data-stime = '${stime}' data-etime = '${etime}'>${ly}</p>`;
                        v = v.substr(v.indexOf(ly) + ly.length);
                    }
                });
        }
    }

    createMusic(item){
        let musiclist= `
        <div class="music_list_area_music">
            <div class ="music_list_cover_box"><img src="image/${item['albumImage']}" alt="music_cover" class="music_list_cover"></div>
            <div class="music_list_info">
                <p class="music_list_title">${item['name']}</p>
                <p class="music_list_artist">${item['artist']}</p>
            </div>
            <div class="music_list_area_music_hover" id="idx_${item['idx']}">
                <button class="music_list_button" data-id = "${item['idx']}"><i class="fa fa-play play" data-id = "${item['idx']}"></i></button>
            </div>
        </div>
        `;
        return musiclist;
    }
}

class queue{

    createMusic(){
        document.querySelector("#playlist_music").innerHTML = "";
        let list = JSON.parse(App.load("music_list"));
        let times = 0;
        let queue = JSON.parse(App.load("queue_list"));
        if(queue !== false){
            queue.forEach(async (item,idx) =>{
                this.createMusicBox(list,item,idx);
            });
        }
    }

    createMusicBox(list,item,idx){
        let music=`<div class="playlist_music" id="idx_${item}" data-num="${idx}">
            <img src="image/${list[item]['albumImage']}" alt="cover">
            <div class="playlist_music_info">
                <p class="playlist_music_title">${list[item]['name']}</p>
                <p class="playlist_music_artist">${list[item]['artist']}</p>
                <p class="playlist_music_time">${this.changeTime(list[item]['duration'])}</p>
            </div>
            <div class="playlist_music_num">#${idx + 1}</div>
        </div>`;
        document.querySelector("#playlist_music").innerHTML += music;
    }

    lyricsTime(){
        document.querySelectorAll("#music_play_text_area p").forEach(item =>{
           let now_time = document.querySelector("#music_audio").currentTime;
           let lyrics_st = item.getAttribute("data-stime"),lyrics_et = item.getAttribute("data-etime");
           if(now_time >= lyrics_st && now_time <=lyrics_et){
            if(!item.classList.contains("now_lyrics")) item.classList.add("now_lyrics");
           }else{
            if(item.classList.contains("now_lyrics")) item.classList.remove("now_lyrics");
           }
           if(document.querySelector(".now_lyrics")) document.querySelector("#music_play_text_area").scrollTop = document.querySelector(".now_lyrics").offsetTop - (parseInt($("#music_play_text_area").css("height")) / 2);
        });
    }

    QueueNowMusic(){
        let now_music = JSON.parse(App.load("now_queue"));
        let music_list = JSON.parse(App.load("music_list"));
        let queue_list = JSON.parse(App.load("queue_list"));
        let now_idx = music_list[queue_list[now_music]]['idx'];
        queue_list.forEach((item,idx)=>{
            if(idx !== now_music && document.querySelector("#idx_"+item) && document.querySelector("#idx_"+item).classList.contains("now")) document.querySelector("#idx_"+item).classList.remove("now");
        });
        if(document.querySelector("#idx_"+now_idx) && !document.querySelector("#idx_"+now_idx).classList.contains("now")) document.querySelector("#idx_"+now_idx).classList.add("now");
    }

    changeTime(time){
        let m = "0" + Math.floor(time % 3600 / 60);
        m = m.substring(m.length - 2, m.length);
        let s = "0" + Math.floor(time % 60);
        s = s.substring(s.length - 2, s.length);
        return `${m}:${s}`;
    }
}

class Link{
    constructor(){
        this.LinkEvent();
        this.app = new App();
    }

    LinkEvent(){
        window.addEventListener("click",(e)=>{
            if(e.target.classList.contains("link")){
                let href = e.target.getAttribute("data-href");
                history.pushState({data:""},null,href);
                fetch(href)
                    .then(v => v.text())
                    .then(v => {
                        let reg = /<!--\scontent-->[^]+<div\sid="content">([^]*)<\/div>[^]+<!--\sendcontent-->/;
                        if(reg.exec(v)){
                            let content = reg.exec(v)[1];
                            document.querySelector("#content").innerHTML = content;
                            let loading = document.createElement("div");
                            loading.id = "Loading";
                            loading.innerHTML = `<div class="loading_circle"></div>`;
                            document.querySelector("body").appendChild(loading);
                            setTimeout(()=>{
                                document.querySelector("body").removeChild(document.querySelector("#Loading"));
                                this.app.PageLoad();
                            },500);
                        }
                    });
            }
        });
    }
}

window.onload = ()=>{
    let link = new Link();
}