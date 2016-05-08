

// this requests the file and executes a callback with the parsed result once
//   it is available


var jsonData;

document.addEventListener("DOMContentLoaded", main);

function main(evt) {

    var nextImageButton = document.querySelector('#nextImageButton');
    nextImageButton.addEventListener('click', handleImage);

    
}
function handleImage(evt) {



        fetchJSONFile('/json/photos.json', function(data){
        // do something with your data
            console.log("next image button clicked");
            // get the value of the input field
            var imageSrc = document.querySelector('#bg').src;
            var imageID = document.querySelector('#bg').alt;
            var currentImage = document.querySelector('#bg');
            

            var jsonPhotos = data;
            var photos = jsonPhotos.photo;
            var currentIndex = photos.filter(function(currImage, index){
                    if (currImage.id == imageID){
                        var photosLength = photos.length;
                        console.log(photosLength);

                        var i;
                        console.log('currnentIndex: ', index);

                        if (index < photosLength - 1){
                            i = 1 + index;
                        }
                        else {
                            i = 0;
                        }
                        console.log(i);
                        var nextImage = photos[i];

                        var photoAddr = "https://farm" + nextImage.farm + ".staticflickr.com/" + nextImage.server + "/" + nextImage.id + "_" + nextImage.secret + ".jpg";
                     
                        document.getElementById("bg").setAttribute("src", photoAddr);
                        document.getElementById("bg").setAttribute("alt", nextImage.id);

                    }
            });
            

        });
   
    



}



function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
                jsonData = data;
                console.log("test");
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send(); 
}
