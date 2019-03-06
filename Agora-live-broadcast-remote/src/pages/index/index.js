import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import '../../assets/css/main.css';

import RtcClient from '../../utils/rtcClient'
import SignalClient from '../../utils/signalClient'
import { AGORA_APP_ID } from '../../../static/agora.config';
import { DualType } from '../../utils/constants';

$(() => {
  const appid = AGORA_APP_ID;
  let account = "Audience";
  let channel = "1000";
  let role = "audience";
  let rtc = new RtcClient(appid);
  let signal = new SignalClient(appid);

  // find spare container to place video into
  const findSpareContainer = () => {
    let $containers = $(`.video-container`);
    for( let i = 0; i < $containers.length; i++) {
      let $container = $($containers.get(i));
      let id = $container.attr('id');
      if(!id) {
        return $container;
      }
    }
    throw new Error(`no spare container left`);
  }

  // sync streams object with dom
  const syncStreamDisplay = streams => {
    //check removed streams
    let $containers = $(`.video-container`);
    for( let i = 0; i < $containers.length; i++) {
      let $container = $($containers.get(i));
      let id = $container.attr('id');
      if(!id) {
        continue;
      }
      let uid = id.split('-')[2];
      if(streams.filter(i => `${i.uid}` === `${uid}`).length === 0) {
        $container.removeAttr('id');
        $container.html('');
      }
    }

    //check newly added streams
    streams.forEach(stream => {
      let uid = stream.uid;
      let id = `agora-video-${uid}`;
      let $dom = $(`#${id}`);
      if($dom.length === 0) {
        //not found
        let $container = findSpareContainer();
        $container.attr('id', id);
        let dualType = $container.attr("dual");
        if(dualType === "main") {
          //bigger screen uses high stream, which has higher resolution and bandwidth consumption
          rtc.setRemoteStreamType(stream, DualType.High);
        } else {
          //small screen uses low stream, which has lower resolution and bandwidth consumption
          rtc.setRemoteStreamType(stream, DualType.Low);
        }
        stream.stream.play(id)
      }
    });
  }


  //bind stream update event
  rtc.on('streamlist-update', streams => {
    syncStreamDisplay(streams);
  });

  //by default call btn is disabled
  Promise.all([rtc.init(channel, role === "broadcaster"), signal.init(account, channel, role)]);

});