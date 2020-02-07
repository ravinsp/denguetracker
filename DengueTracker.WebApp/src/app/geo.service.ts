import { Injectable } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import { Observable } from 'rxjs';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GeoService {
    private geocoder: any;

    constructor(private mapLoader: MapsAPILoader) {
        this.mapLoader.load().then(() => {
            this.initGeocoder();
        });
    }
  
    private initGeocoder() {
      this.geocoder = new google.maps.Geocoder();
    }

    public getCoordinate(address: string): Observable<{lat: number, lon: number}> {
        return new Observable(observer => {
            this.geocoder.geocode({'address': address}, (results, status) => {
              if (status == google.maps.GeocoderStatus.OK) {
                observer.next({
                  lat: results[0].geometry.location.lat() as number, 
                  lon: results[0].geometry.location.lng() as number
                });
              } else {
                  console.log('Geocoding error - ', results, ' | status - ', status);
                  observer.next({ lat: 0, lon: 0 });
              }
              observer.complete();
            });
          })
    }

}
