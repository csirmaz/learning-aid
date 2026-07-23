

function local_hook_has(hook_name) {
    return (typeof(bee_local) !== 'undefined' && bee_local[hook_name]);
}


function call_local_hook(hook_name, args) {
    if(local_hook_has(hook_name)) {
        return bee_local[hook_name].apply(null, args);
    }
    return undefined;
}


// In-page replacement for window.alert(). The native dialog is unavailable in
// some embedded webviews, so we build our own modal entirely here (no markup or
// styling lives in the HTML/CSS files). It is asynchronous - a modal cannot
// block JS - so an optional callback() fires once the box is dismissed.
function bee_alert(message, callback) {
    const $overlay = $('<div></div>').css({
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,.4)', zIndex: 999999
    });
    const $box = $('<div></div>').css({
        position: 'absolute', left: '8px', top: '8px',
        maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 24px)', overflow: 'auto',
        padding: '12px', background: '#fff', color: '#000',
        border: '1px solid #444', borderRadius: '4px',
        font: '16px sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,.4)'
    });
    const $msg = $('<div></div>').css({marginBottom: '10px', whiteSpace: 'pre-wrap'}).text(message);
    const $ok = $('<button>OK</button>').css({font: 'inherit', padding: '4px 16px'});
    $box.append($msg).append($ok);
    $overlay.append($box);
    $('body').append($overlay);
    $ok.on('click', function() {
        $overlay.remove();
        if(callback) { callback(); }
    });
    $ok.focus();
}


// In-page replacement for window.prompt(). Like bee_alert() this is built and
// styled entirely here and is asynchronous: the result is delivered to
// callback(value) rather than returned. value is the entered string on OK, or
// null on Cancel - matching the native prompt() contract. default_value
// pre-fills the field.
// is_password (optional): render a masked field
function bee_prompt(message, callback, default_value, is_password) {
    const $overlay = $('<div></div>').css({
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,.4)', zIndex: 999999
    });
    const $box = $('<div></div>').css({
        position: 'absolute', left: '8px', top: '8px',
        maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 24px)', overflow: 'auto',
        padding: '12px', background: '#fff', color: '#000',
        border: '1px solid #444', borderRadius: '4px',
        font: '16px sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,.4)'
    });
    const $msg = $('<div></div>').css({marginBottom: '10px', whiteSpace: 'pre-wrap'}).text(message);
    const $input = $(is_password ? '<input type="password">' : '<input type="text">').css({
        display: 'block', width: '100%', boxSizing: 'border-box',
        marginBottom: '10px', padding: '4px', font: 'inherit'
    });
    if(default_value !== undefined) { $input.val(default_value); }
    const $ok = $('<button>OK</button>').css({font: 'inherit', padding: '4px 16px', marginRight: '8px'});
    const $cancel = $('<button>Cancel</button>').css({font: 'inherit', padding: '4px 16px'});
    $box.append($msg).append($input).append($ok).append($cancel);
    $overlay.append($box);
    $('body').append($overlay);
    // Deliver the result once, then tear the box down
    const close = function(value) {
        $overlay.remove();
        if(callback) { callback(value); }
    };
    $ok.on('click', function() { close($input.val()); });
    $cancel.on('click', function() { close(null); });
    // Enter confirms, Escape cancels - mirrors the native dialog
    $input.on('keydown', function(e) {
        if(e.key == 'Enter') { close($input.val()); }
        else if(e.key == 'Escape') { close(null); }
    });
    $input.focus();
}


// If we are called via the puzzle alerter, dismiss the window
function dismiss_puzzle_alert() {
    if(window.PuzzleAlerter && typeof window.PuzzleAlerter.solved === 'function') {
        window.PuzzleAlerter.solved();
        return;
    }
    else {
        bee_alert('Cannot dismiss puzzle');
    }
}

// Check if we can dismiss the puzzle and do so. Returns true if we dismissed it,
// so the caller can stop before generating/speaking another question (see new_question).
function check_dismiss_puzzle() {
    if(bee.is_puzzle && bee.is_puzzle.needs <= 0) {
        dismiss_puzzle_alert();
        return true;
    }
    return false;
}

// The player name may be specified in the URL. Returns null if not available
function get_player_from_url() {
    const urlString = window.document.location.href;
    const paramString = urlString.split('?')[1];
    const queryString = new URLSearchParams(paramString);
    const player_name = queryString.get('player');
    return player_name;
}


function load_local_data() {
    console.log("Loading local data...");
    if(localStorage[bee.app_name]) {
        bee.storage = JSON.parse(localStorage[bee.app_name]);
        call_local_hook('loaded_hook', [bee.app_name]);
    }
}


// Initial function
function bootstrap() {

    const pre_chosen_player = get_player_from_url();

    // Apps with bee.no_welcome (videolearn) autostart with the URL-named player: no welcome
    // screen, no session sound and no button to press. Server data is loaded first when the
    // load_data hook is present, otherwise we run on browser-local data.
    if(pre_chosen_player && bee.no_welcome) {
        bee.player = pre_chosen_player;
        bee.is_puzzle = {needs: bee.puzzle_needs};
        $('.game').hide();
        $('.startmenu').html('Loading...');
        load_local_data(); // keep the full list of users
        const start = function() {
            const go = function() {
                $('.startmenu').hide();
                $('.game').show();
                main();
            };
            // Make sure a player record exists (init_player_data is non-interactive here)
            if(!bee.storage.players[bee.player]) { init_player_data(go); }
            else { go(); }
        };
        if(local_hook_has('load_data')) {
            // If the server is down, load_data never calls back and we stay on "Loading...", for safety
            bee_local.load_data(bee.app_name, pre_chosen_player, function(success) { start(); });
        }
        else {
            start();
        }
        return;
    }

    if(pre_chosen_player && local_hook_has('load_data')) {
        bee.player = pre_chosen_player;
        bee.is_puzzle = {needs: bee.puzzle_needs};
        
        // Load player data
        $('.game').hide();
        $('.startmenu').html('Loading...');
        load_local_data(); // if we don't populate the full list of users, they get lost
        // Load data from server
        // If the server is down, we get stuck here, for safety
        bee_local.load_data(bee.app_name, pre_chosen_player, function(success) {
            if(!success && !bee.storage.players[pre_chosen_player]) {
                // init_player_data() is asynchronous (it may prompt the user); the
                // start menu below renders meanwhile, kept covered by the modal
                bee_alert("Player data not found (remote or local), starting new", function() {
                    init_player_data();
                });
            }
            // Render stub menu
            // We could likely play audio even before a user event, but let's keep this
            $('.startmenu').html('<div class="startbutton" style="padding:1rem">'+'🪙'+"\ufe0f"+' Let\'s earn<br>some coins!</div>');
            // We need both the sound to end and the button to be tapped to start
            let start_game_condition = {button: false, sound: false};
            const try_start_game = function(reason) {
                if(start_game_condition === false) { return; }
                start_game_condition[reason] = true;
                if(!(start_game_condition.button && start_game_condition.sound)) { return; }
                start_game_condition = false; // do not start game multiple times                
                $('.startmenu').hide();
                $('.game').show();
                main();
            };
            setTimeout(function() {  // allow time for rendering
                $('.startbutton').on('click', function() {
                    try_start_game('button');
                    $(this).css({background: '#777'});
                    return false;
                });
                try { bee_confetti.addConfetti({emojis: ['🪙'+"\ufe0f"], confettiNumber: 40}); } catch(e) {}
                play_rnd_sound('session', function(){ try_start_game('sound'); });
            }, 200);
        });
        return;
    }
    
    // Regular menu with choice of users
    // Audio can only be played after a user event on the page, so we require a click
    load_local_data(); // only the local data has a list of users
    let menu = "<p>Choose player</p>";
    for (const [key, value] of Object.entries(bee.storage.players)) {
        menu += '<div class="startbutton" data-player="'+esc_html(key)+'">'+esc_html(key)+'</div>';
    }
    menu += '<div class="startbutton" data-playernew="1">New user<br><span style="font-size:60%">All player data is stored in the browser only</span></div>';
    $('.game').hide();
    $('.startmenu').html(menu);

    // Start menu - logic
    setTimeout(function() {  // allow time for rendering
        $('.startbutton').on('click', function() {

            const is_new = $(this).data('playernew');
            const chosen = $(this).data('player');

            // Once a player is settled, refresh from the server (if available) and start
            const proceed = function() {
                if(local_hook_has('load_data')) {
                    $('.startmenu').html('Loading...');
                    // Refresh player data from the server
                    // If the server is down, we get stuck here, for safety
                    bee_local.load_data(bee.app_name, bee.player, function(success) {
                        $('.startmenu').hide();
                        $('.game').show();
                        main();
                    });
                }
                else {
                    $('.startmenu').hide();
                    $('.game').show();
                    main();
                }
            };

            if(is_new) {
                bee_prompt("What is the name of the player?", function(name) {
                    if(name === null || name === '') { return; }
                    bee.player = name;
                    // Initialize
                    if(!bee.storage.players[bee.player]) {
                        init_player_data(function() {
                            save_storage('init');
                            proceed();
                        });
                    } else {
                        bee_alert("That player already exists. Loading player data", proceed);
                    }
                });
            } else {
                bee.player = chosen;
                proceed();
            }

            return false;
        });
    }, 200);

}


function save_storage(msg, callback) {
    // console.log("  Saving storage", msg);
    const s = JSON.stringify(bee.storage);
    localStorage[bee.app_name] = s;
    
    if(!local_hook_has('save_hook')) {
        if(callback) { callback(true); }
        return;
    }

    call_local_hook('save_hook', [msg, callback]);
}


const bee_app_version = 476;

call_local_hook('check_version', []);


function esc_html(s) {
    s = String(s);
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}


function choose_from(array) {
    return array[Math.floor(Math.random() * array.length)];
}


function shuffle(array) {  // in-place
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function remove_duplicates(array) {
    let seen = {};
    const o = [];
    for(let i=0; i<array.length; i++) {
        if(seen[array[i]]) { continue; }
        o.push(array[i]);
        seen[array[i]] = true;
    }
    return o;
}


// Return bool
function arrays_intersect(a1, a2) {
    for(let i=0; i<a1.length; i++) {
        if(a2.includes(a1[i])) { return true; }
    }
    return false;
}


function check_url(url, callback) {
    $.ajax({
        type: 'HEAD',
        url: url,
        success: function(){ callback(true); },
        error: function(){ callback(false); },
        timeout: 1000
    });
}


// Fix emojis
$('.score .icon').html('🪙'+"\ufe0f");
$('.gifts .open').html('🎁'+"\ufe0f");
$('.giftannounce span').html('🎁'+"\ufe0f");
$('.timeoutwarn').html('⏰'+"\ufe0f");


const audio = {
    click: {'file':'assets/sounds/click.ogg', 'volume':.3, 'object':false},
    notavail: {'file':'assets/sounds/wronganswer-37702.mp3', 'volume':1, 'object':false},
    level_complete: [
        {file: 'assets/sounds/success/congrats1.mp3', volume: 1, object: false},
        {file: 'assets/sounds/success/congrats2.mp3', volume: 1, object: false}
    ],
    success_speech: [
        {file: 'assets/sounds/success/good1.mp3', volume: 1, object: false},
        {file: 'assets/sounds/success/good2.mp3', volume: 1, object: false},
        {file: 'assets/sounds/success/well_done.mp3', volume: 1, object: false},
        {file: 'assets/sounds/success/well_done2.mp3', volume: 1, object: false},
        {file: 'assets/sounds/success/well_done3.mp3', volume: 1, object: false},
        {file: 'assets/sounds/success/correct1.mp3', volume: 1, object: false},
        {file: 'assets/sounds/success/correct2.mp3', volume: 1, object: false},
    ],
    success: [
        {file: 'assets/sounds/success/goodresult-82807.mp3', 'volume': .25, 'object': false},
        {file: 'assets/sounds/success/success-340660.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/sample_confirm_success02_kofi_by_miraclei-360154.mp3', 'volume': .8, 'object': false},
        {file: 'assets/sounds/success/yipee-45360.mp3', 'volume': .8, 'object': false},
        {file: 'assets/sounds/success/purchase-succesful-ingame-230550.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/success-fanfare-trumpets-6185.mp3', 'volume': .5, 'object': false},
        // {file: 'assets/sounds/success/11l-victory_sound_with_t-1749487402950-357606.mp3', 'volume': .3, 'object': false},
        // {file: 'assets/sounds/success/11l-victory_sound_with_t-1749487409696-357609.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/11l-game_complete_notifi-1749489486836-360350.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/11l-triumphant_orchestra-1749487505211-360357.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/11l-victory-1749704552668-358772.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/level-up-05-326133.mp3', 'volume': .6, 'object': false},
        {file: 'assets/sounds/success/bonus-points-190035.mp3', 'volume': .6, 'object': false},
        {file: 'assets/sounds/success/correct-356013.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/get-coin-351945.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/classic-game-action-positive-30-224562.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/classic-game-action-positive-27-224558.mp3', 'volume': .4, 'object': false},
        {file: 'assets/sounds/success/arcade-ui-14-229514.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/arcade-ui-29-229501.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/rising-funny-game-effect-132474.mp3', 'volume': .25, 'object': false},
        {file: 'assets/sounds/success/puyopuyomegafan1234-winner-game-sound-404167.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/universfield-game-bonus-03-487857.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/freesound_community-good-6081.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/liecio-collect-points-190037.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/universfield-video-game-bonus-323603.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/dragon-studio-correct-472358.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/latent-rick-achievement-badge-pop-sound-2-547865.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/floraphonic-cute-level-up-1-189852.mp3', 'volume': .5, 'object': false},
        {file: 'assets/sounds/success/astralsynthesizer-11l-victory_beat-1749704521130-358766.mp3', 'volume': .5, 'object': false},
    ],
    session: [
        // {file: 'assets/sounds/session/floraphonic-playful-casino-slot-machine-jackpot-3-183921.mp3', volume: .7, object: false},
        // {file: 'assets/sounds/session/pw23check-winning-218995.mp3', volume: .7, object: false},
        // {file: 'assets/sounds/session/breakzstudios-upbeat-pop-intro-logo-6-201064.mp3', volume: .7, object: false},
        // {file: 'assets/sounds/session/bombinsound-kids-funk-intro-music-499479.mp3', volume: .7, object: false},
        // {file: 'assets/sounds/session/dariocoiro-intro-podcast-530684.mp3', volume: .7, object: false},
        {file: 'assets/sounds/session/puzzle_begin_1.mp3', volume: .8, object: false},
        {file: 'assets/sounds/session/puzzle_begin_2.mp3', volume: .8, object: false},
        {file: 'assets/sounds/session/puzzle_begin_3.mp3', volume: .8, object: false},
        {file: 'assets/sounds/session/puzzle_begin_4.mp3', volume: .8, object: false},
        {file: 'assets/sounds/session/puzzle_begin_5.mp3', volume: .8, object: false}
    ],
    // Played as the celebratory send-off when a puzzle session is completed (see success_common)
    puzzle_end: [
        {file: 'assets/sounds/puzzle_end/puzzle_end_1.mp3', volume: .8, object: false},
        {file: 'assets/sounds/puzzle_end/puzzle_end_2.mp3', volume: .8, object: false},
        {file: 'assets/sounds/puzzle_end/puzzle_end_3.mp3', volume: .8, object: false},
        {file: 'assets/sounds/puzzle_end/puzzle_end_4.mp3', volume: .8, object: false}
    ],
    music: [
        {file: 'assets/music/satisfying-lofi-for-focus-study-amp-working-242103.mp3', volume: .1, object: false}
    ]
};
        
        
const giftelements = [ // Order matters - what gifts a player has is recorded using the index
    'assets/images/gifts/ai-generated-8658573_640.png',
    'assets/images/gifts/animal-6987017_640.jpg',
    'assets/images/gifts/avocado-3651037_640.png',
    'assets/images/gifts/banana-2850841_640.png',
    'assets/images/gifts/cat-4475583_640.png',
    'assets/images/gifts/cat-5773481_640.jpg',
    'assets/images/gifts/cat-5781057_640.jpg',
    'assets/images/gifts/cat-7928232_640.png',
    'assets/images/gifts/cat-8266486_640.jpg',
    'assets/images/gifts/cat-8863536_640.png',
    'assets/images/gifts/chicken-159496_640.png',
    'assets/images/gifts/dog-3431913_640.jpg',
    'assets/images/gifts/ghost-8250317_640.png',
    'assets/images/gifts/lion-5487377_640.png',
    'assets/images/gifts/robot-8449206_640.jpg',
    'assets/images/gifts/sheep-35599_640.png',
];

        
// Videos played at times as a reward
let videos = [];
if(local_hook_has('local_videos')) {
    videos = videos.concat(bee_local.local_videos);
}
        
        
const bee_confetti = new JSConfetti();
        

// Check if the page should be refreshed to bring in new versions
function page_update() {
    if(bee.is_puzzle) { return; }
    if(Date.now() - bee.load_time > 4*60*60*1000) {
        window.location.reload(true);
        return;
    }
    call_local_hook('check_version', []);
}


// Keep a backgrounded tab fresh: when the child returns to a tab that has been hidden for a while,
// reload so bootstrap()/load_data pulls the latest saved state (notably the shared aquarium, which
// another app/tab may have changed). Guarded so a quick glance-away or an in-progress puzzle is
// never disturbed. The 180s threshold matches the current_question_time anti-cheat window, so a
// post-reload start_question does not also fire that penalty.
let bee_hidden_at = null;
function bee_return_reload() {
    if(bee.is_puzzle || bee.player === false) { return; }
    if(bee_hidden_at !== null && Date.now() - bee_hidden_at >= 180*1000) {
        window.location.reload(true);
    }
}
document.addEventListener('visibilitychange', function() {
    if(document.hidden) { bee_hidden_at = Date.now(); }
    else { bee_return_reload(); }
});
window.addEventListener('pageshow', function(e) {
    // bfcache restore: JS state (bee_hidden_at, set on the hide before the freeze) is preserved.
    if(e.persisted) { bee_return_reload(); }
});
        
        
// Show a reward animation (confetti)
function show_animation(callback) {
    const r = Math.random();
    if(r > .8) {
        bee_confetti.addConfetti({confettiColors: ['#00f', '#0c0', '#0ff', '#50f', '#0f0']}).then(callback);
    } else if(r > .6) {
        bee_confetti.addConfetti({confettiColors: ['#f00', '#f99', '#f5c', '#ff0', '#f90']}).then(callback);
    } else if(r > .4) {
        bee_confetti.addConfetti({emojis: ['🍭'+"\ufe0f", '🍥'+"\ufe0f", '🍬'+"\ufe0f"]}).then(callback);
    } else if(r > .2) {                
        bee_confetti.addConfetti({emojis: ['🌼'+"\ufe0f", '🌸'+"\ufe0f", '🍀'+"\ufe0f"]}).then(callback);
    } else {                
        bee_confetti.addConfetti({emojis: ['😀'+"\ufe0f", '🥳'+"\ufe0f", '😎'+"\ufe0f"]}).then(callback);
    }
}
        
        
// Play a video full-screen, then call callback() when it ends (or is closed early).
// video_list (optional) is the catalogue to choose from; it defaults to the reward `videos`.
// A video the player has not seen yet is picked at random and recorded as seen, which is
// persisted via save_storage (so the server keeps the per-player history too). Once every
// video in the list has been seen, the earliest-seen ones are re-enabled (the oldest entries
// are dropped from videos_seen) so the rotation can carry on. The videolearn app drives this
// with its own catalogue. Returns true if no video could be shown (so the caller can fall back
// to another reward, or dismiss), false if a video is now playing.
function play_video(callback, video_list) {
    const reward_videos = (video_list === undefined);
    if(reward_videos) { video_list = videos; }

    let video_file = undefined;
    // The reward-video override hook only applies to the reward catalogue
    if(reward_videos && local_hook_has('choose_video')) { video_file = bee_local.choose_video(); }
    if(video_file === undefined) {
        if(video_list.length == 0) { return true; } // true: no video to show
        // Choose a video the player has not seen yet
        if(bee.storage.players[bee.player].videos_seen === undefined) {
            bee.storage.players[bee.player].videos_seen = [];
        }
        const videos_seen = bee.storage.players[bee.player].videos_seen;
        let videos_remaining;
        while(true) {
            videos_remaining = video_list.filter((v) => videos_seen.indexOf(v) == -1);
            if(videos_remaining.length == 0) {
                // Everything has been seen: re-enable the earliest-seen ones and try again
                for(let i=0; i<8; i++) { videos_seen.shift(); }
                continue;
            }
            break;
        }
        const video_ix = Math.floor(Math.random() * videos_remaining.length);
        video_file = videos_remaining[video_ix];
        videos_seen.push(video_file);
    }
    save_storage('videos_seen');

    const $wrap = $('<div class="video_w2"><div class="videoclose">X</div></div>');
    $('body').append($wrap);
    setTimeout(function() {
        console.log("Playing video", video_file);
        const $v = $('<video src="'+video_file+'" playsinline class="video_v" autoplay></video>');
        const $inwrap = $('<div class="video_w1"></div>');
        let ended = false;
        const ending = function(curtain_delay) {
            return function() {
                if(ended) { return; }
                ended = true;
                $v.remove();
                setTimeout(function() {
                    $wrap.remove();
                    if(callback) { callback(); }
                }, curtain_delay);
            };
        };
        $('.video_w2 .videoclose').on('click', ending(200));
        $v.on('ended', function() { setTimeout(ending(3000), 700); });
        $v.on('stalled', ending);
        $v.on('error', ending);
        $inwrap.append($v);
        $wrap.append($inwrap);
    }, 1000);
    return false; // false: do now show default reward animation
}


// update UI & animate to update score
function update_score_ui(do_animate) {
    const score = bee.storage.players[bee.player].score;
    $('.score .value').html(esc_html(score));
    if(do_animate !== false) {
        $('.score').addClass((score % bee.score_goal == 0) ? 'goldpulse' : 'pulse');
        if(bee.score_anim_timeout !== false) { clearTimeout(bee.score_anim_timeout); }
        bee.score_anim_timeout = setTimeout(function() {
            $('.score').removeClass('pulse').removeClass('goldpulse');
            bee.score_anim_timeout = false;
        }, 1500);
    }

    // bar
    if(bee.is_puzzle) {
        // In puzzle mode the level bar is repurposed to track progress towards puzzle_needs.
        // The "X done of Y" message and the bar are merged into one: the message's own
        // background is the bar, filling from bright gold (done) to dark gold (remaining).
        const total = bee.puzzle_needs;
        let done = total - bee.is_puzzle.needs;
        if(done < 0) { done = 0; }
        if(done > total) { done = total; }
        // Start the fill at 10% rather than empty, so zero progress still shows a sliver.
        const pct = total > 0 ? 10 + done / total * 90. : 10;
        $('.score').addClass('puzzle');
        $('.score .icontext').html(''); // no level number in puzzle mode
        $('.score .needed')
            .html(esc_html(done + ' done of ' + total))
            .css('background', 'linear-gradient(to right, #d2c500 '+pct+'%, #a70 '+pct+'%)');
    }
    else {
        $('.score .icontext').html(score < bee.score_goal ? '' : esc_html(Math.floor(score / bee.score_goal)));
        $('.score .bar .barfill').css('width', ((score % bee.score_goal) / bee.score_goal * 100.)+'%');
        $('.score').toggleClass('goal_reached', score >= bee.score_goal);
        $('.score .needed').html(bee.score_goal - (score % bee.score_goal));
    }
    
    // remaining to next gift
    if(bee.storage.players[bee.player].lifetime_score !== undefined
        && bee.storage.players[bee.player].next_gift_at !== undefined) {
        const r = bee.storage.players[bee.player].next_gift_at - bee.storage.players[bee.player].lifetime_score;
        $('.gifts .needed').html(esc_html(r < 0 ? 0 : r));
    }
    
}
        
        
// The lifetime score tracks coins awarded since the user was created; used by the gift system
function init_lifetime_score() {
    if(bee.player === false) { return; }
    if(bee.storage.players[bee.player].lifetime_score === undefined) {
        bee.storage.players[bee.player].lifetime_score = bee.storage.players[bee.player].score;
    }
}

        
// "negative score" is used to lengthen a level as a penalty; we skip adding scores for every integer
function add_negative_score(v, is_absolute) {
    if(bee.storage.players[bee.player].negative_score === undefined) {
        bee.storage.players[bee.player].negative_score = v;
    } else {
        bee.storage.players[bee.player].negative_score += v;
    }
    if(is_absolute) {
        bee.storage.players[bee.player].negative_score = v;
    }
    const neg_max = bee.max_negative_score;
    if(bee.storage.players[bee.player].negative_score > neg_max) {
        bee.storage.players[bee.player].negative_score = neg_max;
    }
    console.log("negative score: set to", bee.storage.players[bee.player].negative_score);
    save_storage('add_negative_score');
}
        
        
// Add one to the score. Returns the new score or
// '_SKIPPED_' if we're working through the negative scores or skip_this_score is set
function add_score(skip_this_score) {
    let skipped_score = false;
    init_lifetime_score();
    if(bee.storage.players[bee.player].negative_score !== undefined && bee.storage.players[bee.player].negative_score >= 1) {
        // "negative score" is used to lengthen a level as a penalty; we skip adding a score
        bee.storage.players[bee.player].negative_score -= 1;
        console.log("negative score: skipping adding score; neg score is now", bee.storage.players[bee.player].negative_score);
        skipped_score = true;
    } else if(skip_this_score) {
        skipped_score = true;
    } else {
        bee.storage.players[bee.player].score++;
    }
    bee.storage.players[bee.player].lifetime_score++;
    // In puzzle mode every correct answer counts towards completion — including repeats and
    // answers skipped by the negative-score penalty — so wrong or repeat answers don't
    // lengthen the fixed-length puzzle session (add_score only runs on a correct answer).
    if(bee.is_puzzle) { bee.is_puzzle.needs--; }
    save_storage('add_score');
    return (skipped_score ? '_SKIPPED_' : bee.storage.players[bee.player].score);
}


// Play a specific sound given a raw object {object:, file:, volume:}
function _play_obj(d, callback, max_timeout) {
    if(d.object === false) { 
        // console.log("Audio: setting up", d['file']);
        d.do_end = function() {
            if(d.fallback_timeout !== false) { clearTimeout(d.fallback_timeout); }
            d.fallback_timeout = false;
            if(d.has_ended) { return; }
            d.has_ended = true;
            if(d.callback) { d.callback(); }
        };
        try {
            d.object = new Audio(d['file']); 
            d.object.volume = d['volume']; 
            d.object.addEventListener('ended', (e) => { d.do_end(); });
            d.object.addEventListener('stalled', (e) => { d.do_end(); });
            d.object.addEventListener('error', (e) => { d.do_end(); });
            d.object.addEventListener('abort', (e) => { d.do_end(); });
        } catch(e) {
            console.error("Error during setting up audio", e);
            d.do_end();
        }
    } 
    try {
        d.callback = callback;
        d.has_ended = false;
        if(max_timeout === undefined) { max_timeout = 6*1000; }
        d.fallback_timeout = setTimeout(d.do_end, max_timeout);
        d.object.play();
    } catch(e) {
        console.error("Error during playing audio", e);
        d.do_end();
    }
}

// Play a specific sound identified by the key `f`
function playme(f, callback) {
    _play_obj(audio[f], callback);
}
        
        
// Play a random sound from a list given by `f`
function play_rnd_sound(f, callback) {
    const i = Math.floor(Math.random() * audio[f].length);
    _play_obj(audio[f][i], callback);
}


function play_success_sound(callback) {
    // Do not use speech-based reward sound in spellbee
    if(bee.app_name == 'spellbee') {
        play_rnd_sound('success', callback);
        return;
    }
    
    const i = Math.floor(Math.random() * (audio['success'].length + audio['success_speech'].length));
    if(i < audio['success'].length) {
        play_rnd_sound('success', callback); 
    } else {
        play_rnd_sound('success_speech', callback); 
    }
}
        
        
// Play the `ix`th music
function toggle_play_music(ix) {
    const d = audio.music[ix];
    if(d.object === false) { 
        console.log("Audio: setting up", d['file']);
        d.object = new Audio(d['file']); 
        d.object.volume = d['volume'];
        d.object.loop = true;
        d.object.play();
        return;
    }
    if(d.object.paused) { d.object.play(); return; }
    d.object.pause();
}


// Call this to zero the score of the current player
function clear_score() {
    if(bee.player === false) { bee_alert("Choose a player first"); return; }
    bee.storage.players[bee.player].score = 0;
    save_storage('clear_score');
    update_score_ui();
}


// Interactively reduce the score
function reduce_score() {
    if(bee.player === false) { bee_alert("Choose a player first"); return; }
    bee_prompt("Reduce score by", function(value) {
        const diff = value - 0;
        if(isNaN(diff)) { return; }
        bee.storage.players[bee.player].score -= diff;
        save_storage('reduce_score');
        update_score_ui();
    });
}
        

// Decide whether to give player a gift. One gift per twice the score goal
// Give the gift when the "lifetime score" (unaffected by reductions) reaches
// next_gift_at, which is set to a random position in every 2nd goal stretch
function decide_gift() {
    init_lifetime_score();
    const ls = bee.storage.players[bee.player].lifetime_score;
    
    bee_aquarium.decide_award_food(ls);
    
    if(bee.storage.players[bee.player].next_gift_at === undefined) {
        const completed_goals = Math.floor(ls / bee.score_goal);
        const completed_two_goals = Math.floor(completed_goals / 2) * 2;
        const offset = Math.floor((Math.random() + 1) * bee.score_goal) + 1;
        const n = completed_two_goals * bee.score_goal + offset;
        console.log("Gift: Next gift init", completed_goals, completed_two_goals, offset, n);
        bee.storage.players[bee.player].next_gift_at = n;
        save_storage('decide_gift');
        return false;
    } 

    if(ls >= bee.storage.players[bee.player].next_gift_at) {
        if(bee_aquarium.initial_stage()) {
            return ls + Math.floor((1 + Math.random()*.5) * bee.score_goal); // speed up gifts while populating aquarium
        }
        const completed_goals = Math.floor(ls / bee.score_goal);
        const completed_two_goals = Math.floor(completed_goals / 2) * 2;
        const offset = Math.floor((Math.random() + 1) * bee.score_goal) + 1;
        const n = (completed_two_goals+2) * bee.score_goal + offset;
        console.log("Gift: Next gift update", completed_goals, completed_two_goals, offset, n);
        return n; // returns next_gift_at
    }
    
    return false;
}
        
        
// Number: normal gift, L+number: local gift
function gift_label_to_img(l) {
    if(String(l)[0] == 'L') {
        l = l.substring(1, l.length) - 0;
        if(local_hook_has('local_gifts')) {
            const g = bee_local.local_gifts[l];
            // A "code" gift is an object {user, code}, not an image path
            if(g && typeof g === 'object') { return 'assets/images/unknown_gift.png'; }
            return g;
        }
        return 'assets/images/unknown_gift.png';
    }
    return giftelements[l];
}


// If the gift label refers to a "code" gift (a local_gifts entry shaped like
// {user, code}) return that object, otherwise false. Code gifts render their code
// instead of an image.
function gift_code_data(l) {
    if(String(l)[0] != 'L') { return false; }
    if(!local_hook_has('local_gifts')) { return false; }
    const g = bee_local.local_gifts[String(l).substring(1) - 0];
    if(g && typeof g === 'object' && g.code !== undefined) { return g; }
    return false;
}


// Inner HTML for a code gift: a header with the code in bigger letters underneath
function gift_code_html(code_data) {
    return '<div class="codegift-header">Farm game code</div>'
        + '<div class="codegift-code">' + esc_html(code_data.code) + '</div>';
}


// Render a gift (by label) into a container that holds both an <img> and a .codegift
// element, showing whichever fits the gift. Pass fade_in=true to fade the shown one in.
function render_gift($container, label, fade_in) {
    const code_data = gift_code_data(label);
    let $show, $hide;
    if(code_data) {
        $container.find('.codegift').html(gift_code_html(code_data));
        $show = $container.find('.codegift');
        $hide = $container.find('img');
    } else {
        $container.find('img').attr('src', gift_label_to_img(label));
        $show = $container.find('img');
        $hide = $container.find('.codegift');
    }
    $hide.stop(true, true).hide();
    $show.stop(true, true);
    if(fade_in) { $show.hide().fadeIn(); }
    else { $show.css('opacity', 1).show(); }
}
        
        
// Give the player a gift
function give_gift(callback, return_gift_only) {
    // Decide between aquarium and traditional gifts
    if(bee_aquarium.is_active() && !return_gift_only) {
        
        if(bee.storage.players[bee.player].gift_seq_ix === undefined) {
            bee.storage.players[bee.player].gift_seq_ix = 0;
        }
        // g=traditional gift i=aquarium item f=aquarium fish
        const gift_sequence = ['i','f','g'];
        const gift_type = gift_sequence[bee.storage.players[bee.player].gift_seq_ix];
        bee.storage.players[bee.player].gift_seq_ix++;
        if(bee.storage.players[bee.player].gift_seq_ix >= gift_sequence.length) { bee.storage.players[bee.player].gift_seq_ix = 0; }

        if(gift_type == 'f' || gift_type == 'i') {
            const r = (gift_type == 'f' ? bee_aquarium.grant_fish() :  bee_aquarium.grant_item() );
            save_storage('give_gift');
            const aq_callback = function() {
                if(bee_aquarium.on_aquarium_gift) { bee_aquarium.on_aquarium_gift(); }
                if(callback) { callback(); }
            };
            present_gift(r.img_src, aq_callback);
            return;
        }
    }
    
    // Gifts the player already has
    if(bee.storage.players[bee.player].gifts === undefined) {
        bee.storage.players[bee.player].gifts = [];
    }
    bee.storage.players[bee.player].gifts = remove_duplicates(bee.storage.players[bee.player].gifts);
    const giftarray = bee.storage.players[bee.player].gifts;
    
    // Load list of available gifts
    let local_gifts = [];
    if(local_hook_has('local_gifts')) {
        local_gifts = bee_local.local_gifts;
    }
    
    const max_gifts = giftelements.length + local_gifts.length;
    if(giftarray.length >= max_gifts) { 
        console.log("No more gifts to give");
        return;
    }
    
    // Choose gift we can give. Number: normal gift, L+number: local gift
    let gix = false;
    if(local_hook_has('choose_gift_hook')) {
        gix = bee_local.choose_gift_hook(giftarray);
    }
    if(gix === false) {
        let trials = 0;
        while(true) {
            let i = Math.floor(Math.random() * max_gifts);
            gix = (i < giftelements.length ? i : 'L' + (i - giftelements.length));
            // Code gifts are user-specific; they are only handed out via choose_gift_hook
            if(giftarray.includes(gix) || gift_code_data(gix) !== false) {
                trials++;
                if(trials > max_gifts * 10) {
                    console.log("Could not find gift to give");
                    return;
                }
                continue;
            }
            break;
        }
    }
    console.log("Gift chosen", gix, gift_label_to_img(gix));
    if(return_gift_only) { return gix; }
    giftarray.push(gix);
    save_storage('give_gift');
    const code_data = gift_code_data(gix);
    present_gift(code_data ? false : gift_label_to_img(gix), callback, code_data);
}


function present_gift(img_src, callback, code_data) {
    if(code_data) {
        $('.giftannounce img').hide();
        $('.giftannounce .codegift').html(gift_code_html(code_data)).hide();
    } else {
        $('.giftannounce .codegift').hide();
        $('.giftannounce img').hide().attr('src', img_src);
    }
    $('.giftannounce span').show();
    $('.giftannounce').fadeIn(1500);
    setTimeout(function() {
        $('.giftannounce span').hide();
        if(code_data) { $('.giftannounce .codegift').show(); }
        else { $('.giftannounce img').show(); }
        show_animation();
        setTimeout(function() {
            $('.giftannounce').fadeOut(1500);
            $('.gifts').addClass('goldpulse');
            setTimeout(function() {
                $('.gifts').removeClass('goldpulse');
                if(callback) { callback(); }
            }, 1500);
        }, 4000); // showing gift
    }, 4000); // showing gift box
}


// Celebratory send-off when a puzzle session is completed on a plain success (i.e. one with no
// gift, end-of-level or video reward of its own): a random puzzle_end sound plus confetti, then
// dismiss the host webview. Called just before the puzzle is dismissed. We wait for BOTH the
// send-off sound and the confetti to finish before dismissing, because dismissing tears down the
// page and would otherwise cut the audio off mid-play (play_rnd_sound has its own fallback timeout,
// so the join always completes even if the 'ended' event never fires).
function finish_puzzle_with_confetti() {
    let pending = 2;
    const done = function() { if(--pending <= 0) { dismiss_puzzle_alert(); } };
    play_rnd_sound('puzzle_end', done);
    show_animation(done);
}


// Implements common operations when a task is solved
// Return values: 'level_complete' | 'gift' | 'period_negative' | 'period'
// Note: there are two ways to skip adding a score. Either add 'skip_this_score':true to options, or increment the negative score
function success_common(options) {
    const wait_factor = 1.2;
    const fast_to_next_question = options.fast_to_next_question;
    const skip_this_score = options.skip_this_score;
    
    console.log('#success_common()');
    const score = add_score(skip_this_score);  // the new score or "_SKIPPED_"
    const new_next_gift_at = decide_gift(); // precede update_score_ui() to update remaining-to-gift display
    update_score_ui();

    // level complete logic (see "L" below)
    if(score !== '_SKIPPED_' && score % bee.score_goal == 0) {
        call_local_hook('level_hook', [score]);
        play_rnd_sound('level_complete');
        bee_confetti.addConfetti({emojis: ['🪙'+"\ufe0f"], confettiNumber: 300}).then(
            function() { 
                setTimeout(function(){
                    if(play_video(function(){ new_question('success_common:level:video1'); })) { 
                        new_question('success_common:level:video2');
                    }
                }, 1500*wait_factor);
            }
            // no need to call the gift logic; gift will be given on next step
        );
        return 'level_complete';
    }
    
    // check if gift is due (not represented in the chart)
    if(new_next_gift_at !== false) {
        bee.storage.players[bee.player].next_gift_at = new_next_gift_at;
        save_storage('success_common>gift');
        play_success_sound();
        give_gift(function() {
            update_score_ui(false);
            new_question('success_common:gift:give');
        }, false);
        return 'gift';
    }

    const celebrate_period = (bee.score_goal < 30 ? 4 : 5);
    
    // special logic for working through negative scores
    if(score === '_SKIPPED_' && bee.storage.players[bee.player].lifetime_score !== undefined && bee.storage.players[bee.player].lifetime_score % celebrate_period == 0) {
        if(bee.is_puzzle && bee.is_puzzle.needs <= 0) { finish_puzzle_with_confetti(); return 'period_negative'; }
        show_animation(function() { setTimeout(function(){ new_question('success_common:negscore:period'); }, 1100*wait_factor); });
        return 'period_negative';
    }

    // default logic to go to next question (no periodic celebration - see "x" below)
    if(score === '_SKIPPED_' || score % celebrate_period > 0) {
        if(bee.is_puzzle && bee.is_puzzle.needs <= 0) { finish_puzzle_with_confetti(); return 'default'; }
        if(fast_to_next_question) {
            setTimeout(function(){ new_question('success_common:default:fast'); }, 700*wait_factor);
        }
        else {
            play_success_sound();
            setTimeout(function(){ new_question('success_common:default:slow'); }, 2700*wait_factor);
        }
        return 'default';
    }
    
    /*
        *   celebrate_period=4, for example when score_goal=20
        *                              1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2
        *   score: 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8
        *            x x x p x x x p x x x p x x x p x x x L x x x p x x x p
        *   period_ix:     1       2       3       4       5       6       7
        *   bigger:                B               b       L               B     (B=always bigger, b=bigger at random)
        * 
        * 
        *   celebrate_period=5, for examle when score_goal=30
        *                              1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3 3 3 3 3 3 3 3 3 3
        *   score: 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0
        *            x x x x p x x x x p x x x x p x x x x p x x x x p x x x x L x x x x p x x x x p
        *   period_ix:       1         2         3         4         5         6         7         8
        *   bigger:                    B                   B                   L                   B
        */
    
    // periodic celebration (see "p", "B", "b")
                
    // Bigger celebration with video
    let bigger = false;
    if(score !== '_SKIPPED_') { // should always be true, see above
        const period_ix = Math.floor(score / celebrate_period);
        const periods_in_level = Math.floor(bee.score_goal / celebrate_period);
        const period_ix_lev = (period_ix % periods_in_level);
        if(period_ix_lev == 2) { bigger = true; }
        if(celebrate_period == 5 && period_ix_lev == 4) { bigger = true; }
        if(celebrate_period == 4 && period_ix_lev == 4 && Math.random() <= .7) { bigger = true; }
    }
    if(!bigger) {
        // smaller periodic celebration - see "p" (or the puzzle send-off if a puzzle just finished)
        if(bee.is_puzzle && bee.is_puzzle.needs <= 0) { finish_puzzle_with_confetti(); return 'period'; }
        play_success_sound();
        show_animation(function() { setTimeout(function(){ new_question('success_common:period:small'); }, 1100*wait_factor); });
        return 'period';
    }
    // bigger periodic celebration - see "B": try a reward video (a video is excluded from the puzzle send-off)
    play_success_sound();
    if(play_video(function(){ new_question('success_common:period:video'); })) {
        // no video available - fall back to the smaller celebration (or the puzzle send-off)
        if(bee.is_puzzle && bee.is_puzzle.needs <= 0) { finish_puzzle_with_confetti(); return 'period'; }
        show_animation(function() { setTimeout(function(){ new_question('success_common:period:small'); }, 1100*wait_factor); });
    }
    return 'period';
}


function delete_user() {
    if(bee.player === false) { bee_alert("Choose a player first"); return; }
    bee_prompt("Type 'delete' to delete the user: " + bee.player, function(conf) {
        if(conf != 'delete') { bee_alert("Not deleting"); return; }
        delete bee.storage.players[bee.player];
        save_storage('delete_user');
    });
}
        
// text-to-speech support
        
const bee_tts = {
    status: 'init', // 'init' | 'ready' | 'fail' | 'bridge'
    voice: false,  // selected voice
    voice_points: -1,  // scoring to select voice
    synth: window.speechSynthesis,
    init_trials: 6,
    available_voices: []
};
        
bee_tts.test = function() {
    bee_tts.speak('This is what text to speach sounds like: '+Math.floor(Math.random()*100), function(){
        bee_alert(bee_tts.voice.name+' '+bee_tts.voice.lang+' '+bee_tts.voice.localService, function() {
            bee_alert(bee_tts.available_voices.join("\n"));
        });
    });
};
        
bee_tts.initialize = function() {
    if(window.PuzzleAlerter && typeof window.PuzzleAlerter.speak === 'function') {
        bee_tts.status = 'bridge';
        return;
    }
    if(!bee_tts.synth) {
        console.log("TTS failed (not available)");
        bee_tts.status = 'fail';
        return;
    }
    bee_tts.init_trials--;
    if(bee_tts.init_trials <= 0) {
        console.log("TTS init failed (after tries)");
        bee_tts.status = 'fail';
        return;
    }
    console.log("TTS init, trial=", bee_tts.init_trials);
    try {
        const voices = bee_tts.synth.getVoices();
        if(!voices.length) {
            setTimeout(bee_tts.initialize, 1000);
            return;
        }
        for (const voice of voices) {
            let p = 0;
            if(voice.lang.startsWith('en')) { p += 100; bee_tts.available_voices.push("["+voice.name+"]"); }
            if(voice.lang.toLowerCase().endsWith('gb')) { p += 2; }
            if(voice.name.indexOf('female') == -1) { p += 1; }
            if(voice.localService) { p += 5; }
            if(p > bee_tts.voice_points) { bee_tts.voice_points = p; bee_tts.voice = voice; }
        }
        if(bee_tts.voice_points < 100) {
            console.log("TTS init failed (no English voice)");
            bee_tts.status = 'fail';
            return;
        }
        console.log("TTS ready - selected voice", bee_tts.voice);
        bee_tts.status = 'ready';
        return;
    } catch(e) {
        console.log("TTS init: error", e);
        bee_tts.status = 'fail';
        return;                
    }
};

// Returns approximate speaking time based on a string
bee_tts.speaking_time = function(s) {
    return 80*s.length + 250;
};


bee_tts.speak_callback_index = 0;
bee_tts.speak_callbacks = {};

// Speak an utterance. Returns true if utterance is being spoken; then callback() will be called on end.
bee_tts.speak = function(s, callback) {
    if(bee_tts.status == 'bridge') {
        try {
            if(callback) {
                const cbi = bee_tts.speak_callback_index;
                bee_tts.speak_callbacks[cbi] = function(success) {
                    delete bee_tts.speak_callbacks[cbi];
                    callback(success);
                };
                window.PuzzleAlerter.speak(s, 'bee_tts.speak_callbacks['+cbi+']');
                bee_tts.speak_callback_index++;
            } else {
                window.PuzzleAlerter.speak(s);
            }
            return true;
        } catch(e) {
            if(callback) { setTimeout(callback, 1000); }
            return false;
        }
    }
    
    if(bee_tts.status != 'ready') {
        console.log("TTS speak: not ready");
        setTimeout(callback, 1000);
        return false;
    }
    try {
        const utterThis = new SpeechSynthesisUtterance(s);
        utterThis.voice = bee_tts.voice;
        // utterThis.pitch = 1.; // default
        //utterThis.rate = rate.value;
        if(callback) {
            utterThis.addEventListener('end', callback);
            utterThis.addEventListener('error', callback);
        }
        bee_tts.synth.speak(utterThis);
        return true;
    } catch(e) {
        console.log("TTS speak error", e);
        if(callback) { setTimeout(callback, 1000); }
        return false;
    }
};

setTimeout(bee_tts.initialize, 500);
        

const licences = `
| Fireworks module from https://github.com/crashmax-dev/fireworks-js/tree/v1 (MIT)
| Confetti module from https://github.com/loonywizard/js-confetti (MIT)
| 
Sound Effect by <a href="https://pixabay.com/users/u_2gxydaiwcd-46893983/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340660">u_2gxydaiwcd</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340660">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/puyopuyomegafan1234-45913026/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=404167">Sophia Conçeição</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=404167">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=6185">freesound_community</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=6185">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/miraclei-45186201/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=360154">MiraclEI</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=360154">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/ribhavagrawal-39286533/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=230550">Ribhav Agrawal</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=230550">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/peekaboolabcreative-22100005/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=357606">Nussaraporn Haleebut</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=357606">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/universfield-28281460/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=326133">Universfield</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=326133">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/liecio-3298866/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=190035">LIECIO</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=190035">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/koiroylers-44305058/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=356013">Koi Roylers</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=356013">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/doubleducks-45864631/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=360357">Phurisarah H</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=360357">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/matthewvakaliuk73627-48347364/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=290204">Matthew Vakalyuk</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=290204">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/floraphonic-38928062/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=224562">floraphonic</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=224562">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/pw23check-44527802/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=218995">PW23CHECK</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=218995">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/dragon-studio-38165424/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=472358">DRAGON-STUDIO</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=472358">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/latent-rick-54823268/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=547865">Latent Rick</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=547865">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/breakzstudios-38548419/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=201064">Breakz Studios</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=201064">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/bombinsound-54782632/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=499479">Bomb Sound</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=499479">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/humordome-44873699/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=453255">Humor Dome</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=453255">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/dariocoiro-54756271/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=530684">Dario Coiro</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=530684">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/astralsynthesizer-50776509/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=358772">Sarah H</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=358772">Pixabay</a>
| Words TTS by https://ttsmp3.com/ (No restrictions on use)        
|
Image by <a href="https://pixabay.com/users/madebytin-39325616/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8266486">madebytin</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8266486">Pixabay</a>
Image by <a href="https://pixabay.com/users/wixin_56k-9838171/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=3651037">wixin lubhon</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=3651037">Pixabay</a>
Image by <a href="https://pixabay.com/users/julieta_masc-5768105/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=2850841">Julieta Mascarella</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=2850841">Pixabay</a>
Image by <a href="https://pixabay.com/users/trtasfiq-43093431/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8658573">TASFIQ UR RAHMAN NABIL</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8658573">Pixabay</a>
Image by <a href="https://pixabay.com/users/kirillslov-8058952/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5773481">Kirill</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5773481">Pixabay</a>
Image by <a href="https://pixabay.com/users/alexandra_koch-621802/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=6987017">Alexandra_Koch</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=6987017">Pixabay</a>
Image by <a href="https://pixabay.com/users/u_81xq4cg3pz-44281484/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8863536">Swagata Pyne</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8863536">Pixabay</a>
Image by <a href="https://pixabay.com/users/openclipart-vectors-30363/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=159496">OpenClipart-Vectors</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=159496">Pixabay</a>
Image by <a href="https://pixabay.com/users/limoncitosketching-7400657/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=4475583">Marta Simon</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=4475583">Pixabay</a>
Image by <a href="https://pixabay.com/users/andremsdesign-40088375/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8449206">André Santana</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=8449206">Pixabay</a>
Image by <a href="https://pixabay.com/users/no-longer-here-19203/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=3431913">No-longer-here</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=3431913">Pixabay</a>
Image by <a href="https://pixabay.com/users/edurs34-8516248/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=7928232">Eduardo • Subscribe to my YT Channel❤️</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=7928232">Pixabay</a>
Image by <a href="https://pixabay.com/users/clker-free-vector-images-3736/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=35599">Clker-Free-Vector-Images</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=35599">Pixabay</a>
Image by <a href="https://pixabay.com/users/neas_artwork-2743866/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5487377">Linnéa</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=5487377">Pixabay</a>
|
Music by <a href="https://pixabay.com/users/fassounds-3433550/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=242103">FASSounds</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=242103">Pixabay</a>
`;


let smallprint_expanded = false;
$('.smallprint .handle').on('click', function() {
    // Toggle the licences / tools panel open or closed
    const toggle_smallprint = function() {
        $('.smallprint .expand').html(licences).toggle();
        $('.smallprint .expand_tools').toggle();
        smallprint_expanded = !smallprint_expanded;
    };
    if(!smallprint_expanded) {
        bee_prompt("Age verification: What is the capital of Finland?", function(answer) {
            if(answer === null || answer.toLowerCase() != 'helsinki') { return; }
            toggle_smallprint();
        }, undefined, true);
        return false;
    }
    toggle_smallprint();
    return false;
});
        
        
$('.smallprint .d_version').html(esc_html(bee_app_version));


// Confirm before leaving page - cannot dismiss webview if we do
$(function() {
    $(document).on('click', 'a', function(e) {
        // Use the attribute, not this.href: the DOM property is already resolved to an
        // absolute URL, so it would start with "http" even for a relative link.
        const href = $(this).attr('href') || '';
        if(href.startsWith('http')) {
            e.preventDefault();
            if(bee.is_puzzle) {
                bee_prompt("Copy this URL and visit it in a broswer", function(v) { return; }, href);
            } else {
                bee_prompt("Are you sure you want to leave this page?", function(v) {
                    if(v === null) { return; }
                    window.location.href = href;
                }, 'Yes');
            }
            return false;
        }
        return true;
    });
});


// ------------------- Tab / screen switching -------------------------

// Switch the visible panel.
function switch_to_tab(tabname) {
    $('.tab-panel-game').hide();
    $('.tab-panel-aquarium').hide();
    $('.tab-panel-gifts').hide();
    bee.giftlist = -1; // the index of the gift shown, -1 for tab being closed
    $('.gifts').removeClass('opened');
    $('.aquarium-btn').removeClass('opened');

    if (tabname === 'game') {
        $('.tab-panel-game').show();
    } else if (tabname === 'aquarium') {
        $('.tab-panel-aquarium').show();
        $('.aquarium-btn').addClass('opened');
    } else if (tabname === 'gifts') {
        bee.giftlist = 0;
        $('.tab-panel-gifts').show();
        $('.gifts').addClass('opened');
        if (bee.player !== false) {
            const giftarray = bee.storage.players[bee.player].gifts;
            if (giftarray !== undefined && giftarray.length !== 0) {
                render_gift($('.giftlist .list'), giftarray[bee.giftlist]);
            }
        }
    }
}


// ------------------- Gift display -------------------------

$('.gifts').on('click', function() {
    switch_to_tab(bee.giftlist === -1 ? 'gifts' : 'game');
    return false;
});
        
// Go to next gift in list
$('.giftlist .list .next, .giftlist .list img, .giftlist .list .codegift').on('click', function() {
    if(bee.giftlist == -1) { return false; }
    const giftarray = bee.storage.players[bee.player].gifts;
    if(giftarray === undefined || giftarray.length == 0) { return false; }
    bee.giftlist++;
    if(bee.giftlist >= giftarray.length) { bee.giftlist = 0; }
    render_gift($('.giftlist .list'), giftarray[bee.giftlist]);
    $('.d_queue').html(giftarray[bee.giftlist]);
    return false;
});

// Go to previous gift
$('.giftlist .list .prev').on('click', function() {
    if(bee.giftlist == -1) { return false; }
    const giftarray = bee.storage.players[bee.player].gifts;
    if(giftarray === undefined || giftarray.length == 0) { return false; }
    bee.giftlist--;
    if(bee.giftlist <= 0) { bee.giftlist = giftarray.length - 1; }
    render_gift($('.giftlist .list'), giftarray[bee.giftlist]);
    $('.d_queue').html(giftarray[bee.giftlist]);
    return false;
});

// Exchange gift
$('.giftlist .list .exchange').on('click', function() {
    console.log("Exchanging gift");
    if(bee.giftlist == -1) { return false; }
    const giftarray = bee.storage.players[bee.player].gifts;
    if(giftarray === undefined || giftarray.length == 0) { return false; }
    
    const diff = 2;
    
    bee_prompt("This will cost "+diff+" coins.", function(v) {
        if(v === null) { return; }
        
        if(bee.storage.players[bee.player].score < diff) { playme('notavail'); return false; }
        bee.storage.players[bee.player].score -= diff;
        save_storage('gift exchange cost');
        update_score_ui();

        const gix = give_gift(undefined, true);
        giftarray[bee.giftlist] = gix;
        save_storage('gift exchange');
        $('.giftlist .list img:visible, .giftlist .list .codegift:visible').fadeOut({duration: 2000, complete: function() {
            render_gift($('.giftlist .list'), giftarray[bee.giftlist], true);
        }});
    }, "Are you sure?");
    return false;    
});

// ---------------- Aquarium -----------------

const bee_aquarium = {
    game: undefined,
    // Set true by the data-load hook (load_data) for a non-spellbee app when the server returned
    // shared aquarium data for the player. Spellbee is always active regardless.
    _enabled: false,
    food_counter: $('.aq-feed-btn .count')
};
// Usage: bee_aquarium.init_game()

bee_aquarium.is_active = function() {
    return (bee.app_name == 'spellbee' || bee_aquarium._enabled);
};

bee_aquarium.get_storage_key = function(player_name) {
    if(player_name === undefined) {
        if(bee.player === false) {
            bee_alert("Aquarium: No player chosen yet");
            player_name = 'DEFAULT';
        } else {
            player_name = bee.player;
        }
    }
    // The app segment is frozen to 'spellbee' (the aquarium's original app) so the key is the SAME
    // across apps -> one shared aquarium, and existing spellbee keys keep working.
    return 'Aquarium:spellbee:' + player_name;
};

bee_aquarium.init_game = function() {
    if(bee_aquarium.is_active()) {
        bee_aquarium.game = new Aquarium(document.getElementById('aquarium'), {
            'storageKey': bee_aquarium.get_storage_key(),
            'basePath': 'assets/aquarium'
        });
    }
};

bee_aquarium.get_data = function() {
    // Per-app aquarium state in the game blob. Only the food-award SCHEDULE (next_food_at, tied to
    // this app's score) lives here now; the food wallet and the fish/item collection are shared and
    // live in the widget's own persisted state.
    if(bee.storage.players[bee.player].aquarium_data === undefined) {
        bee.storage.players[bee.player].aquarium_data = {};
    }
    return bee.storage.players[bee.player].aquarium_data;
};

bee_aquarium.init_food = function() {
    if(!bee_aquarium.is_active()) { return; }
    bee_aquarium.food_counter.html(bee_aquarium.game.getFoodCount());
};

bee_aquarium.decide_award_food = function(lifetime_score) {
    if(!bee_aquarium.is_active()) { return; }
    const d = bee_aquarium.get_data();
    if(d.next_food_at === undefined || d.next_food_at <= lifetime_score) {
        d.next_food_at = lifetime_score + 6;
        bee_aquarium.award_food();
    }
};

bee_aquarium.award_food = function() {
    if(!bee_aquarium.is_active()) { return; }
    // Food wallet is shared -> lives in the widget's persisted state.
    bee_aquarium.food_counter.html(bee_aquarium.game.addFoodCount(1));
};

bee_aquarium.feed = function() {
    if(!bee_aquarium.is_active()) { return; }
    if(bee_aquarium.game.getFoodCount() <= 0) { return; }
    bee_aquarium.food_counter.html(bee_aquarium.game.spendFoodCount(1));
    bee_aquarium.game.feed(8);
};

bee_aquarium.initial_stage = function() { // Whether we're early in populating
    if(!bee_aquarium.is_active()) { return false; }
    // Fish/item collection is shared -> counted from the widget, not a per-app list.
    if(bee_aquarium.game.fish.length + bee_aquarium.game.items.length < 9) { return true; }
    return false;
};

bee_aquarium.grant_fish = function() {
    if(!bee_aquarium.is_active()) { return false; }
    const typ = bee_aquarium.game.grantFish();
    return {'type': typ, 'img_src': 'assets/aquarium/' + AQUARIUM_CONFIG.fish[typ].src};
};

bee_aquarium.grant_item = function() {
    if(!bee_aquarium.is_active()) { return false; }
    const typ = bee_aquarium.game.grantItem();
    return {'type': typ, 'img_src': 'assets/aquarium/' + AQUARIUM_CONFIG.items[typ].src};
};

// Aquarium panel toggle button
$('.aquarium-btn').on('click', function() {
    switch_to_tab($('.tab-panel-aquarium').is(':visible') ? 'game' : 'aquarium');
    return false;
});

// Feed-fish button inside the aquarium panel
$('.aq-feed-btn').on('click', function() {
    bee_aquarium.feed();
    return false;
});
