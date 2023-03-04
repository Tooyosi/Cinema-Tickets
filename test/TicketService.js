import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js"
import TicketService from "../src/pairtest/TicketService.js"

const validTicketTypeRequests = [
    {
        type: "ADULT",
        noOfTickets: 10
    },
    {
        type: "CHILD",
        noOfTickets: 20
    },
    {
        type: "INFANT",
        noOfTickets: 20
    }
]

const invalidTicketTypeRequests = [
    {
        type: "MAN",
        noOfTickets: 10
    },
    {
        type: "CHILD",
        noOfTickets: 20
    },
    {
        type: "INFANT",
        noOfTickets: 20
    }
]

const testData = {
    accountId: 1,
    validTicketTypeRequests
}

const ticketService = new TicketService();

describe("purchaseTickets exceptions", function(){
    test('should throw an InvalidPurchaseException if no parameters are passed ', function(){
        expect(ticketService.purchaseTickets).toThrow(InvalidPurchaseException);
    })

    test('should throw an InvalidPurchaseException if wrong account id is passed ', function(){
        expect(()=>ticketService.purchaseTickets("wrongId")).toThrow(InvalidPurchaseException);
    })

    test('should throw an InvalidPurchaseException if correct id is passed and no requests are passed', function(){
        expect(()=>ticketService.purchaseTickets(1)).toThrow(InvalidPurchaseException);
    })

    test('should throw an InvalidPurchaseException if wrong ticket types are passed', function(){
        expect(()=>ticketService.purchaseTickets(1, "ticket type")).toThrow(InvalidPurchaseException);
    })

    test('should send invalid information data with invalid requests', function(){
        try {
            ticketService.purchaseTickets(1, ...invalidTicketTypeRequests)
        } catch (error) {
            expect(error.data).toBeTruthy()
            expect(error.data["MAN"]).toBeTruthy()
            expect(error.data["MAN"]).toBe(10)
        }
    })  
})

describe("purchaseTickets success", function(){
    let request;
    
    beforeAll(()=>{
        request = ticketService.purchaseTickets(1, ...validTicketTypeRequests)
    })
    test('should calculate the correct amount paid', function(){
        expect(request.amount).toBeTruthy()
        expect(request.amount).toBe(500)
    })


    test('should calculate the correct number of seats', function(){
        expect(request.seats).toBeTruthy()
        expect(request.seats).toBe(30)
    })

    test('should calculate the valid tickets', function(){
        expect(request.validTickets).toBeTruthy()
        expect(request.validTickets["INFANT"]).toBe(10)
        expect(request.validTickets["ADULT"]).toBe(10)
    })

    test('should calculate the invalid tickets', function(){
        expect(request.invalidTickets).toBeTruthy()
        expect(request.invalidTickets["INFANT"]).toBe(10)
    })
  
})