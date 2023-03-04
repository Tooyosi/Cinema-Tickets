import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #infant = 'INFANT';
  #adult = 'ADULT';
  #child = 'CHILD';
  #childPrice = 10;
  #adultPrice = 30;
  #validTickets = {}
  #invalidTickets = {}

  #reservationService = new SeatReservationService();
  #paymentService = new TicketPaymentService();

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException
    if(isNaN(accountId) || accountId < 1){
      throw new InvalidPurchaseException("Invalid Account");
    }

    if(!ticketTypeRequests){
      throw new InvalidPurchaseException("Invalid Ticket requests");
    }


    // reassigning valid and invalid tickets to prevent summation of previous values
    this.#validTickets = {}
    this.#invalidTickets = {}

    ticketTypeRequests.forEach(singleRequest => {
      if(!singleRequest.type || !singleRequest.noOfTickets){
        return
      }
      try {
        const ticketType = new TicketTypeRequest(singleRequest.type, Number(singleRequest.noOfTickets))

        const type = ticketType.getTicketType()
        const noOfTickets = ticketType.getNoOfTickets()

        // add valid ticket
        this.#addValidTickets(type, noOfTickets)
      } catch (error) {
        // add invalid ticket
        this.#addInvalidTickets(singleRequest.type, singleRequest.noOfTickets)
        return
      }
    });

    const infantTickets = this.#getInfantTicket();
    const adultTickets = this.#getAdultTicket();

    // if no adult, reject all tickets as child and infant can not purchase tickets
    // however, i assume with one adult, multiple children can purchase tickets
    if(adultTickets === 0){
      Object.entries(this.#validTickets).forEach(ticket => {
        this.#addInvalidTickets(ticket[0], ticket[1])
        this.#validTickets = {}
      })
    }
    // infants sitting on adult lap and assuming maximum of one infant to adult and infants more than adults
    if(infantTickets > adultTickets){
      // make infants same as adults and reject the remaining infant tickets
      const difference = infantTickets - adultTickets;
      this.#assignTicket(this.#infant, adultTickets)
      this.#addInvalidTickets(this.#infant, difference)
    }

    // trow error if no valid tickets
    if(!this.#hasValidTickets()){
      const errStr = "There are no valid tickets.\n" + this.#ticketDetails()
      throw new InvalidPurchaseException(errStr, this.#invalidTickets);
    }
    
    const {seats, amount} = this.#getPaymentAmountAndSeats();

    // reserve seats
    const hasReservedSeats = this.#reserveSeats(accountId, seats)
    if(!hasReservedSeats){
      throw InvalidPurchaseException(`Account with id: ${accountId} is unable to reserve seat`)
    }

    // make payment
    const hasPaymentMade = this.#processPayment(accountId, amount)
    if(!hasPaymentMade){
      throw InvalidPurchaseException(`Account with id: ${accountId} is unable to make payment`)
    }

    // return payment details
    return {
      amount,
      seats,
      validTickets :this.#validTickets,
      invalidTickets: this.#invalidTickets
    }
  }

  #hasValidTickets(){
    return Object.keys(this.#validTickets).length > 0
  }

  #ticketDetails(validity="invalid"){
    const ticketObj = validity === "invalid" ? this.#invalidTickets : this.#validTickets;
    let returnStr = Object.keys(ticketObj).length > 0 ? `The following are ${validity} tickets: \n` : "";

    Object.entries(ticketObj).forEach(ticket => {
      returnStr += `${ticket[0]} - ${ticket[1]}\n`
    })
    return returnStr;
  }

  #processPayment(accountId, totalAmountToPay) {
    try {
      this.#paymentService.makePayment(accountId, totalAmountToPay);
      return true
    } catch (error) {
      return false
    }
  }

  #getPaymentAmount(type, amount){
    switch(type){
      case this.#child:
        return amount * this.#childPrice;
      case this.#adult:
        return amount * this.#adultPrice;
      default:
        return amount
    }
  }

  #getPaymentAmountAndSeats(){
    let amount = 0;
    let seats = 0;
    Object.entries(this.#validTickets).forEach(ticket => {
        // dont calculate for infant since their price is 0 and they sit on adult's lap
        if(ticket[0] === this.#infant){
          return
        }
        seats += ticket[1]
        amount += this.#getPaymentAmount(ticket[0], ticket[1])

    })
    return {seats,amount};
  }

  #reserveSeats(accountId, noOfSeats){
    try {
      this.#reservationService.reserveSeat(accountId, noOfSeats)
     return true 
    } catch (error) {
      return false
    }
  }

  #addValidTickets(type, noOfTickets){
    this.#validTickets[type] = this.#validTickets[type] ? this.#validTickets[type] + noOfTickets : noOfTickets;
  }

  #assignTicket(type, noOfTickets){
    this.#validTickets[type] = noOfTickets;
  }

  #addInvalidTickets(type, noOfTickets){
    this.#invalidTickets[type] = this.#invalidTickets[type] ? this.#invalidTickets[type] + noOfTickets : noOfTickets;
  }

  #getInfantTicket(){
    return this.#validTickets[this.#infant] || 0;
  }

  #getAdultTicket(){
    return this.#validTickets[this.#adult] || 0;
  }

  #getChildTicket(){
    return this.#validTickets[this.#child] || 0;
  }
}
