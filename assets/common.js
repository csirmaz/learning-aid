
        // Fix emojis
        $('.score .icon').html('🪙'+"\ufe0f");
        $('.gifts .open').html('🎁'+"\ufe0f");
        $('.giftannounce span').html('🎁'+"\ufe0f");


        const audio = {
            click: {'file':'assets/sounds/click.mp3', 'volume':1, 'object':false},
            notavail: {'file':'assets/sounds/wronganswer-37702.mp3', 'volume':1, 'object':false},
            success: [
                {'file': 'assets/sounds/success/goodresult-82807.mp3', 'volume': .25, 'object': false},
                {'file': 'assets/sounds/success/success-340660.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/sample_confirm_success02_kofi_by_miraclei-360154.mp3', 'volume': .8, 'object': false},
                {'file': 'assets/sounds/success/yipee-45360.mp3', 'volume': .8, 'object': false},
                {'file': 'assets/sounds/success/purchase-succesful-ingame-230550.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/success-fanfare-trumpets-6185.mp3', 'volume': .5, 'object': false},
                {'file': 'assets/sounds/success/11l-victory_sound_with_t-1749487402950-357606.mp3', 'volume': .3, 'object': false},
                {'file': 'assets/sounds/success/level-up-05-326133.mp3', 'volume': .6, 'object': false},
                {'file': 'assets/sounds/success/bonus-points-190035.mp3', 'volume': .6, 'object': false},
                {'file': 'assets/sounds/success/correct-356013.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/get-coin-351945.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/11l-triumphant_orchestra-1749487505211-360357.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/classic-game-action-positive-30-224562.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/classic-game-action-positive-27-224558.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/arcade-ui-14-229514.mp3', 'volume': .5, 'object': false},
                {'file': 'assets/sounds/success/arcade-ui-29-229501.mp3', 'volume': .5, 'object': false},
                {'file': 'assets/sounds/success/rising-funny-game-effect-132474.mp3', 'volume': .25, 'object': false},
                {'file': 'assets/sounds/success/11l-victory-1749704552668-358772.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/11l-victory_sound_with_t-1749487409696-357609.mp3', 'volume': .4, 'object': false},
                {'file': 'assets/sounds/success/11l-game_complete_notifi-1749489486836-360350.mp3', 'volume': .4, 'object': false},
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


        // Data and objects for the fireworks animation
        const fireworks = {
            obj: new Fireworks(document.querySelector('.fireworks-container'), {
                sound: {
                    enabled: true,
                    files: [
                        'assets/fireworks/explosion0.mp3',
                        'assets/fireworks/explosion1.mp3',
                        'assets/fireworks/explosion2.mp3'
                    ],
                    volume: {
                        min: 1,
                        max: 2
                    }
                },
                lineWidth: { explosion: { min: 4, max: 6}, trace: { min: 4, max: 6}},
                // intensity: 20, // default: 30
                delay: { min: 5, max: 10 },
            }),
            playing: false,
            slow_timeout: false,
            stop_timeout: false,
        };
        setTimeout(function(){ $('.fireworks-container').hide(); }, 200);
        

        // Show fireworks for a few seconds
        function show_fireworks(callback) {
            console.log('fireworks: show');
            $('.fireworks-container').show();
            fireworks.obj.setOptions({ delay: { min: 5, max: 10 }});
            if(fireworks.slow_timeout !== false) { 
                console.log('fireworks: clear slow');
                clearTimeout(fireworks.slow_timeout); 
            }
            if(fireworks.stop_timeout !== false) { 
                console.log('fireworks: clear stop');
                clearTimeout(fireworks.stop_timeout); 
            }
            if(!fireworks.playing) {
                console.log('fireworks: start()');
                fireworks.playing = true;
                fireworks.obj.start();
            }
            // fireworks.pause()
            // fireworks.clear()

            fireworks.slow_timeout = setTimeout( function() {
                // Gracefully stop the fireworks
                fireworks.obj.setOptions({ delay: { min: 1000, max: 1000 }});
                fireworks.slow_timeout = false;
            }, 2*1000);
            
            fireworks.stop_timeout = setTimeout( function(){
                console.log('fireworks: stop()');
                fireworks.obj.stop();
                $('.fireworks-container').hide();
                fireworks.stop_timeout = false;
                fireworks.playing = false;
                if(callback) { callback(); }
            }, 3.5*1000);
        }
        
        
        const bee_confetti = new JSConfetti();
        
        
        // Show a reward animation
        function show_animation(callback) {
            const r = Math.random();
            if(r < .3) {
                bee_confetti.addConfetti().then(callback);
            } else { if(r < .6) {
                bee_confetti.addConfetti({emojis: ['🪙'+"\ufe0f"]}).then(callback);
            } else {
                show_fireworks(callback);
            }}
        }


        function esc_html(s) {
            s = String(s);
            return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
        }


        // update UI & animate
        function update_score_ui(do_animate) {
            const score = bee.storage.players[bee.player].score;
            save_storage();
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
            $('.score .bar .barfill').css('width', ((score % bee.score_goal) / bee.score_goal * 100.)+'%');
            $('.score').toggleClass('goal_reached', score >= bee.score_goal);
        }
        
        
        // Add one to the score & update UI & animate
        function add_score() {
            if(bee.storage.players[bee.player].lifetime_score === undefined) {
                bee.storage.players[bee.player].lifetime_score = bee.storage.players[bee.player].score;
            }
            
            bee.storage.players[bee.player].score++;
            bee.storage.players[bee.player].lifetime_score++;
            update_score_ui();
            return bee.storage.players[bee.player].score;
        }


        function playme(f) {
            const d = audio[f];
            if(d['object'] === false) { 
                console.log("Audio: setting up", d['file']);
                d['object'] = new Audio(d['file']); 
                d['object'].volume = d['volume']; 
            }            
            d['object'].play();
        }


        function play_success_sound() {
            const i = Math.floor(Math.random() * audio.success.length);
            const d = audio.success[i];
            if(d['object'] === false) { 
                console.log("Audio: setting up success", d['file']);
                d['object'] = new Audio(d['file']); 
                d['object'].volume = d['volume']; 
            }
            console.log("Audio: playing success", d['file']);
            d['object'].play();
        }


        // Call this to zero the score of the current player
        function clear_score() {
            if(bee.player === false) { alert("Choose a player first"); return; }
            bee.storage.players[bee.player].score = 0;
            update_score_ui();
        }
        
        
        // Interactively reduce the score
        function reduce_score() {
            if(bee.player === false) { alert("Choose a player first"); return; }
            const diff = prompt("Reduce score by") - 0;
            if(isNaN(diff)) { return; }
            bee.storage.players[bee.player].score -= diff;
            update_score_ui();
        }
        
        
        function get_gift_at() {
            if(bee.player === false) { alert("Choose a player first"); return; }
            alert(bee.storage.players[bee.player].lifetime_score + " / " + bee.storage.players[bee.player].next_gift_at);
        }
        
        
        // Decide whether to give player a gift. One gift per twice the score goal
        // Give the gift when the "lifetime score" (unaffected by reductions) reaches
        // next_gift_at, which is set to a random position in every 2nd goal stretch
        function decide_gift() {
            const ls = bee.storage.players[bee.player].lifetime_score;
            if(ls === undefined) { return; }
            
            let give_gift = false;
            if(bee.storage.players[bee.player].next_gift_at === undefined) {
                const completed_goals = Math.floor(ls / bee.score_goal);
                const completed_two_goals = Math.floor(completed_goals / 2) * 2;
                const offset = Math.floor((Math.random() + 1) * bee.score_goal) + 1;
                const n = completed_two_goals * bee.score_goal + offset;
                console.log("Next gift init", completed_goals, completed_two_goals, offset, n);
                bee.storage.players[bee.player].next_gift_at = n;
            } else {
                if(ls >= bee.storage.players[bee.player].next_gift_at) {
                    give_gift = true;
                    const completed_goals = Math.floor(ls / bee.score_goal);
                    const completed_two_goals = Math.floor(completed_goals / 2) * 2;
                    const offset = Math.floor((Math.random() + 1) * bee.score_goal) + 1;
                    const n = (completed_two_goals+2) * bee.score_goal + offset;
                    console.log("Next gift update", completed_goals, completed_two_goals, offset, n);
                    bee.storage.players[bee.player].next_gift_at = n;
                }
            }
            save_storage();
            return give_gift;
        }
        
        
        // Number: normal gift, L+number: local gift
        function gift_label_to_img(l) {
            if(String(l)[0] == 'L') {
                l = l.substring(1, l.length) - 0;
                if(typeof(bee_local) !== 'undefined' && bee_local.local_gifts) {
                    return bee_local.local_gifts[l];
                }
                return 'assets/images/unknown_gift.png';
            }
            return giftelements[l];
        }
        
        
        // Give the player a gift
        function give_gift(callback) {
            // Gifts the player already has
            if(bee.storage.players[bee.player].gifts === undefined) {
                bee.storage.players[bee.player].gifts = [];
            }
            const giftarray = bee.storage.players[bee.player].gifts;
            
            // Load list of available gifts
            let local_gifts = [];
            if(typeof(bee_local) !== 'undefined' && bee_local.local_gifts) {
                local_gifts = bee_local.local_gifts;
            }
            
            const max_gifts = giftelements.length + local_gifts.length;
            if(giftarray.length >= max_gifts) { 
                console.log("No more gifts to give");
                return;
            }
            
            // Choose gift we can give. Number: normal gift, L+number: local gift
            let gix;
            let trials = 0;
            while(true) {
                let i = Math.floor(Math.random() * max_gifts);
                gix = (i < giftelements.length ? i : 'L' + (i - giftelements.length));
                if(giftarray.includes(gix)) { 
                    trials++;
                    if(trials > max_gifts * 10) {
                        console.log("Could not find gift to give");
                        return;
                    }
                    continue; 
                }
                break;
            }
            console.log("Gift chosen", gix, gift_label_to_img(gix));
            giftarray.push(gix);
            save_storage();
            
            $('.giftannounce img').hide().attr('src', gift_label_to_img(gix));
            $('.giftannounce span').show();
            $('.giftannounce').fadeIn(1500);
            setTimeout(function() {
                $('.giftannounce span').hide();
                $('.giftannounce img').show();
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
        
        
        function success_common() {
            play_success_sound();
            const score = add_score();
            if(decide_gift()) {
                give_gift(new_question);
            } else {
                if(score % 4 == 0 || score % bee.score_goal == 0) {
                    if(typeof(bee_local) === 'undefined' 
                        || (!bee_local.local_reward) 
                        || bee_local.local_reward(new_question)
                    ) {
                        show_animation(function() { setTimeout(new_question, 1100); });
                    }
                } else {
                    setTimeout(new_question, 2700);
                }
            }
        }
        

        const licences = `
| Fireworks module from https://github.com/crashmax-dev/fireworks-js/tree/v1 (MIT)
| Confetti module from https://github.com/loonywizard/js-confetti (MIT)
| Sound Effect by <a href="https://pixabay.com/users/u_2gxydaiwcd-46893983/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340660">u_2gxydaiwcd</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340660">Pixabay</a>
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
`;


        $('.smallprint .handle').on('click', function() {
            $('.smallprint .expand').html(licences).toggle();
            return false;
        });

        
        // Display gift list
        $('.gifts').on('click', function() {
            if(bee.giftlist == -1) {
                bee.giftlist = 0;
                $('.game').hide();
                $('.scorewrap').show();
                $('.score').hide();
                $('.giftlist').show();
                $('.gifts').addClass('opened');
                
                const giftarray = bee.storage.players[bee.player].gifts;
                if(giftarray !== undefined && giftarray.length != 0) {
                    $('.giftlist .list img').attr('src', gift_label_to_img(giftarray[bee.giftlist]));
                }
            } else {
                bee.giftlist = -1;
                $('.giftlist').hide();
                $('.game').show();
                $('.score').show();
                $('.gifts').removeClass('opened');
            }
            return false;
        });
        
        // Go to next gift in list
        $('.giftlist .list .next, .giftlist .list img').on('click', function() {
            if(bee.giftlist == -1) { return false; }
            const giftarray = bee.storage.players[bee.player].gifts;
            if(giftarray === undefined || giftarray.length == 0) { return false; }
            bee.giftlist++;
            if(bee.giftlist >= giftarray.length) { bee.giftlist = 0; }
            $('.giftlist .list img').attr('src', gift_label_to_img(giftarray[bee.giftlist]));
            return false;
        });
