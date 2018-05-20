//import { user } from 'firebase-functions/lib/providers/auth';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
'use strict';
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/** 
 * Function untuk menjalankan proses find-match, ketika node find-match telah terisi oleh 2 user berbeda
 * maka semua data di node find-match akan dihapus kemudian dipindahkan ke node matches.
*/
exports.findmatch = functions.database.ref('find-match/{findMatchID}').onUpdate((event) =>{
    var findMatchID = event.params.findMatchID;
    return admin.database().ref("find-match").child(findMatchID).once("value", function(snapshot){
        var users;
        console.log("match id: " + event.params.findMatchID);
        if(snapshot.numChildren() == 3){
            users = snapshot.val();
            console.log('Users List : ', users);
            var pushRef = admin.database().ref("matches").push();
            var pushRefKey = pushRef.key;
            return pushRef.set({
                listOfPlayers: users,
            })
            .then(function(){
                var match_id = pushRefKey;
                snapshot.forEach((usersId) => {
                    if(usersId.key != "numberPlayer"){
                        admin.database().ref("user-matches").child(usersId.key).push().set({
                            matchId: match_id,
                            finished: false
                        });
                    }
                })
                console.log("Match ID : ", match_id);
            })
            .then(function(){
                //admin.database().ref("find-match").child(findMatchID).remove();
                var matchingRef = admin.database().ref("find-match");
                matchingRef.transaction(function(value){
                    return matchingRef.child(findMatchID).set(null);
                })
            });
        }
    });
});

exports.generateIndexKosakata = functions.database.ref('matches/{match_id}').onCreate((event) =>{
    //Mengambil match_id dari fungsi push di exports.findmatch
    var matchId = event.params.match_id;
    console.log("Current Match ID : " + matchId);
    /**
     * Berikut berbagai function untuk :
     * Generate Index Question 10 ke dalam satu array dan RandomAnswer 30 ke dalam satu array
     */

    /**
     * Mengambil jumlah Kosakata yang tersedia dalam Database
     * kemudian di-storekan ke variabel kosakataCount
     */
   
    //Variabel Question
    var questionGenerated = [];
    //Perulangan dilakukan 10 kali
    while(questionGenerated.length < 10){
        //Randomnumber berisi angka acak dari perhitungan Math.Random()*234
        var randomnumber = Math.floor(Math.random()*234) + 1;
        //Pengecekan apakah angka randomnumber sudah tersedia di array questionGenerated[] 
        if(questionGenerated.indexOf(randomnumber) > -1) continue;
        //Memasukkan angka yang sudah dicek ke array questionGenerated[]
        questionGenerated[questionGenerated.length] = randomnumber;
    };
    console.log(questionGenerated);
    console.log("Jumlah Question : " + questionGenerated.length);
    
    /** 
     * Berikut merupakan fungsi Loop untuk mendapatkan 4 jawaban yg memiliki urutan acak dengan komposisi
     * 1 jawaban benar dan 3 jawaban salah
     * 
     * Perulangan 10 kali untuk mendapatkan 10 paket jawaban dengan tiap paket berisi
     * 4 buah jawaban 
     */
    return admin.database().ref("kosakata").once("value", function(snapshot){
        var answersList = [];
        for(var i=0; i<10; i++){
            //console.log("-------------");
            //console.log("snapshot length: "+ snapshot.numChildren());
            //console.log("Iterasi ke-"+i);
        
            //Ini merupakan index jawaban yang benar
            var index = questionGenerated[i];
            var stringIndex = index.toString();
            //console.log("Current KategoriSoal: " + stringIndex);
        
            //Get kategori soal
            getKategoriSoal(stringIndex);
            
            function getKategoriSoal(stringIndex){
                var kategoriSoal = snapshot.child(stringIndex).child("kategori").val();
                //getKategoriSize(kategoriSoal);
                getListKosakataFromKategori(kategoriSoal);
                //console.log("kategori Soal: " + kategoriSoal);
            };
            
            //Get daftar kosakata dari kategoriSoal
            function getListKosakataFromKategori(kategoriSoal){
                var kosakataKategoriSoal = [];
                snapshot.forEach((kosakata)=>{
                    if(kosakata.child("kategori").val()==kategoriSoal){
                        kosakataKategoriSoal.push(kosakata.child("index").val());
                    };
                });
                get3RandomAnswer(kosakataKategoriSoal);
                //console.log("KosakataKategoriSoal Size Queried: " + kosakataKategoriSoal);
            };
            
            //Get 3 jawaban Random/Acak dari daftar Kosakata tadi
            function get3RandomAnswer(kosakataKategoriSoal){
                var indexAnswerArray = [];
                //push jawaban benar
                indexAnswerArray.push(questionGenerated[i]);
                //console.log("IndexAnswerArray ke: "+i+" before : " + indexAnswerArray);
                //console.log("IndexAnswerArray ke: "+i+" size before : " + indexAnswerArray.length);

                /**
                * Mengambil 3 kosakata yg salah secara acak dari array kosakataKategoriSoal
                */
                while(indexAnswerArray.length < 4){
                    var randomnumber = Math.floor(Math.random()*kosakataKategoriSoal.length);
                    var answerIndex = kosakataKategoriSoal[randomnumber]; 
                    if(indexAnswerArray.indexOf(answerIndex) > -1) continue;
                    indexAnswerArray.push(answerIndex);
                }
                shuffleIndexAnswerArray(indexAnswerArray);
                //console.log("Array kosakata nomer "+ i +"[before shuffled]: " + indexAnswerArray);
            };
        
            function shuffleIndexAnswerArray(indexAnswerArray){
                var shuffledIndexAnswerArray = [];
                /**
                * Mengacak indexAnswerArray dari urutan Benar, Salah, Salah, Salah
                */
                while(shuffledIndexAnswerArray.length < 4){
                    var randomnumber = Math.floor(Math.random()*indexAnswerArray.length);
                    var answerIndex = indexAnswerArray[randomnumber];
                    if(shuffledIndexAnswerArray.indexOf(answerIndex) > -1) continue;
                    shuffledIndexAnswerArray[shuffledIndexAnswerArray.length] = answerIndex;
                };
        
                //console.log("Array kosakata nomer "+ i +"[after shuffled]: " + shuffledIndexAnswerArray);
                //console.log("Array kosakata nomer size: " + i + " = " + shuffledIndexAnswerArray.length);
                answersList.push(shuffledIndexAnswerArray);

                //Jika paket jawaban sudah berjumlah 10 array, push array ke firebase
                if(answersList.length===10){
                    pushToFirebase();
                };
                //console.log("Iterasi ke-"+i+" done.");
            };
        
            function pushToFirebase(){
                console.log("Daftar 4 jawaban per soal : " + answersList);
                console.log("Daftar 4 jawaban per soal SIZE : " +answersList.length);
                
                admin.database().ref("matches/" + matchId + "/indexQuestion").set(questionGenerated).then(function(){
                    admin.database().ref("matches/" + matchId + "/indexRandomAnswer").set(answersList);
                });
            };
        }       
    });
});

/**
 * Function untuk menentukan pengguna yang menang dan pengguna yang kalah atau kedua pengguna seri.
 */
exports.finalResults = functions.database.ref('matches/{match_id}/listOfPlayers/{user_id}/finished').onUpdate((event) =>{
    var user_info;
    var match_id = event.params.match_id;
    var user_id = event.params.user_id;
    var enemy_id;
    var user_finished;
    var enemy_finished;
    var user_score;
    var enemy_score;
    var user_list;
    console.log("Match ID " + match_id);

    //get enemy id
    return admin.database().ref('matches/' + match_id + '/listOfPlayers').once("value", function(snapshot){
        snapshot.forEach((users)=>{
            if(user_id != users.key && users.key != "numberPlayer"){
                enemy_id = users.key;
                console.log("Enemy Keys: "+ users.key);
            }
        });
            console.log("Users Count : " + snapshot.numChildren());
            console.log("User ID: "+ user_id);
            user_score = snapshot.child(user_id).child("score").val();
            console.log("Enemy ID "+ enemy_id);
            enemy_score = snapshot.child(enemy_id).child("score").val();
            
            console.log("User Final Score: "+ user_score);
            console.log("Enemy Final Score: "+ enemy_score);
    }).then(function(){
            //get user status
            admin.database().ref('matches/' + match_id + '/listOfPlayers/' + user_id + '/finished').once("value", function(snapshot){
            if(snapshot.val() == null){
                user_finished = false;
            }else{
                user_finished = snapshot.val();
            }
        });
    }).then(function(){
            //get enemy status
            return admin.database().ref('matches/'+ match_id +'/listOfPlayers/' + enemy_id +'/finished').once("value", function(snapshot){
            if(snapshot.val() == null){
                enemy_finished = false;
            }else{
                enemy_finished = snapshot.val();
            }
            console.log("User Finished playing ?: " + user_finished);
            console.log("Enemy Finished playing ?: " + enemy_finished);
       
            //jika user sama2 selesai
            if(user_finished == true && enemy_finished == true){
            console.log("Both User Finished playing");

                //if user score bigger = win, enemy = loss
                if(user_score > enemy_score){
                    /*//set user data in node matches
                    return admin.database().ref('matches/'+ match_id +'/listOfPlayers/' + user_id ).update({
                        result: 'win'
                    });*/
                    pushUserInfoWin(user_id);
                    //set enemy data in node matches
                    /*return admin.database().ref('matches/'+ match_id +'/listOfPlayers/' + enemy_id).update({
                        result: 'loss'
                    });*/
                    pushUserInfoLoss(enemy_id);
                    
            
                //if user & enemy score equals = draw
                }else if(user_score == enemy_score){
                    /*return admin.database().ref('matches/'+ match_id +'/listOfPlayers/' + user_id).update({
                        result: 'draw'
                    });*/
                    pushUserInfoDraw(user_id);
                    /*return admin.database().ref('matches/'+ match_id +'/listOfPlayers/' + enemy_id).update({
                        result: 'draw'
                    });*/
                    pushUserInfoDraw(enemy_id);
                //if user score smaller = loss, enemy = win
                }else if(user_score < enemy_score){
                    /*return admin.database().ref('matches/'+ match_id +'/listOfPlayers/' + user_id).update({
                        result: 'loss'
                    });*/
                    pushUserInfoLoss(user_id);
                    /*return admin.database().ref('matches/'+ match_id +'/listOfPlayers/' + enemy_id).update({
                        result: 'win'
                    });*/
                    pushUserInfoWin(enemy_id);
            }
       
    }
    else{
        return console.log("Enemy not done yet", enemy_finished);    
    }   
    });
    });
});

function pushUserInfoWin(userIDForPush){
    return admin.database().ref('users/' + userIDForPush).once("value", function(snapshot){
        //calculation user
        var matches = snapshot.child('matches').val();
        var win = snapshot.child('win').val();
        var rank = snapshot.child('rank').val();

        console.log(userIDForPush + " User before matches: " + matches);
        console.log(userIDForPush + " User before win: " + win);
        console.log(userIDForPush + " User before rank: " + rank);

        if(matches == null && win == null && rank == null){
            matches = 0;
            win = 0;
            rank = 0;
        }

        matches = matches + 1;
        win = win + 1;
        rank = rank + 3;

        //update data
        return admin.database().ref('users/' + userIDForPush).update({
            "matches" : matches,
            "win" : win,
            "rank" : rank
        }).then(function(){
            return admin.database().ref('ranks/' + userIDForPush).update({
                "rank" : rank
            });
            console.log(userIDForPush + " win");
            console.log(userIDForPush + " User updated matches: " + matches);
            console.log(userIDForPush + " User updated win: " + win);
            console.log(userIDForPush + " User updated rank: " + rank);
        });
    });
    
}

function pushUserInfoDraw(userIDForPush){
    return admin.database().ref('users/' + userIDForPush).once("value", function(snapshot){
        //calculation
        var matches = snapshot.child('matches').val();
        var draw = snapshot.child('draw').val();
        var rank = snapshot.child('rank').val();

        console.log(userIDForPush + " User before matches: " + matches);
        console.log(userIDForPush + " User before draw: " + draw);
        console.log(userIDForPush + " User before rank: " + rank);

        if(matches == null && draw == null && rank == null){
            matches = 0;
            draw = 0;
            rank = 0;
        }

        matches = matches + 1;
        draw = draw + 1;
        rank = rank + 1;

        //update data
        return admin.database().ref('users/' + userIDForPush).update({
            "matches" : matches,
            "draw" : draw,
            "rank" : rank
        }).then(function(){
            return admin.database().ref('ranks/' + userIDForPush).update({
                "rank" : rank,
            });
            console.log(userIDForPush + " draw");
            console.log(userIDForPush + " User updated matches: " + matches);
            console.log(userIDForPush + " User updated rank: " + rank);
        });
    });
}

function pushUserInfoLoss(userIDForPush){
    //get user data
    return admin.database().ref('users/' + userIDForPush).once("value", function(snapshot){
        //calculation
        var matches = snapshot.child('matches').val();
        var loss = snapshot.child('loss').val();
        var rank = snapshot.child('rank').val();

        console.log(userIDForPush + " User before matches: " + matches);
        console.log(userIDForPush + " User before loss: " + loss);
        console.log(userIDForPush + " User before rank: " + rank);

        if(matches == null && draw == null && rank == null){
            matches = 0;
            loss = 0;
            rank = 0;
        }

        matches = matches + 1;
        loss = loss + 1;
        rank = rank - 3;
        if(rank < 0){
            rank = 0;
        }

        //update data
        return admin.database().ref('users/' + userIDForPush).update({
            "matches" : matches,
            "loss" : loss,
            "rank" : rank
        }).then(function(){
            return admin.database().ref('ranks/' + userIDForPush).update({
                "rank" : rank,
            });
            console.log(userIDForPush + " loss");
            console.log(userIDForPush + " User updated matches: " + matches);
            console.log(userIDForPush + " User updated loss: " + loss);
            console.log(userIDForPush + " User updated rank: " + rank);
        });
    });
}