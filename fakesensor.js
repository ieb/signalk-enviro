/*jshint node:true */
"use strict";
/*
 * Copyright 2017 Ian Boston <ianboston@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


(function() {

  var BME280 = module.exports = function(config) {
    this.config = config;
    this.temperature = new RandomScalar(-10,45);
    this.pressure = new RandomScalar(85000,13500);
    this.humidity = new RandomScalar(5,100);
    var self = this;
    setInterval(() => {
      self.temperature.next();
      self.temperature.next();
      self.temperature.next();
    }, 60000);
  }
  BME280.prototype.begin = function(cb) {
    setTimeout(() => {
      cb(false, "Fake sensor");
    }, 150);
  };
  BME280.prototype.readPressureAndTemparature = function(cb) {
    var self = this;
    setTimeout(() => {
      cb(false,self.pressure.v, self.temperature.v, self.humidity.v);
    }, 10);
  };

  function RandomScalar(min, max) {
    this.v = 0;
    this.c = 0;
    this.r = max - min;
    this.mean = (max+min)/2;
    this.min = min;
    this.max = max;
  }
  RandomScalar.prototype.next = function() {
    this.v = this.v - ((Math.random()-0.5-(this.v/(5*this.r))) * (this.v-this.r)/10);
    this.c = this.mean + this.v;
    if ( this.c > this.max ) {
      this.c = this.max;
    } else if ( this.c < this.min ) {
      this.c = this.min;
    } 
  };
}());

