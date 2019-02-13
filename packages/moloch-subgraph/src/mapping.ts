import { BigInt } from '@graphprotocol/graph-ts'
import { Moloch as Contract, SummonComplete, SubmitProposal, SubmitVote, ProcessProposal, Ragequit, Abort, UpdateDelegateKey } from './types/Moloch/Moloch'
import { Proposal, Member, Vote, Applicant } from './types/schema'

export function handleSummonComplete(event: SummonComplete): void {
  let member = new Member(event.params.summoner.toHex())
  member.delegateKey = event.params.summoner
  member.shares = event.params.shares
  member.isActive = true
  member.tokenTribute = BigInt.fromI32(0)
  member.didRagequit = false
  member.votes = new Array<string>()
  member.submissions = new Array<string>()
  member.save()
}

export function handleSubmitProposal(event: SubmitProposal): void {
  let proposal = new Proposal(event.params.proposalIndex.toString())
  proposal.timestamp = event.block.timestamp.toString()
  proposal.proposalIndex = event.params.proposalIndex
  proposal.delegateKey = event.params.delegateKey
  proposal.member = event.params.memberAddress.toHex()
  proposal.memberAddress = event.params.memberAddress
  proposal.applicant = event.params.applicant.toHex()
  proposal.applicantAddress= event.params.applicant
  proposal.tokenTribute = event.params.tokenTribute
  proposal.sharesRequested = event.params.sharesRequested
  proposal.yesVotes = BigInt.fromI32(0)
  proposal.noVotes = BigInt.fromI32(0)
  proposal.processed = false
  proposal.didPass = false
  proposal.aborted = false
  proposal.votes = new Array<string>()
  proposal.save()

  let applicant = new Applicant(event.params.applicant.toHex())
  applicant.timestamp = event.block.timestamp.toString()
  applicant.proposalIndex = event.params.proposalIndex
  applicant.delegateKey = event.params.delegateKey
  applicant.member = event.params.memberAddress.toHex()
  applicant.memberAddress = event.params.memberAddress
  applicant.applicantAddress = event.params.applicant
  applicant.tokenTribute = event.params.tokenTribute
  applicant.sharesRequested = event.params.sharesRequested
  applicant.didPass = false
  applicant.aborted = false
  applicant.votes = new Array<string>()
  applicant.proposal = event.params.proposalIndex.toString()
  
  applicant.save()

  let member = Member.load(event.params.memberAddress.toHex())
  let submission = event.params.proposalIndex.toString()
  let memberSubmissions = member.submissions
  memberSubmissions.push(submission)
  member.submissions = memberSubmissions
  member.save()
}

export function handleSubmitVote(event: SubmitVote): void {
  let voteID = event.params.memberAddress.toHex().concat("-").concat(event.params.proposalIndex.toString())
  
  let vote = new Vote(voteID)
  vote.timestamp = event.block.timestamp.toString()
  vote.proposalIndex = event.params.proposalIndex
  vote.delegateKey = event.params.delegateKey
  vote.memberAddress = event.params.memberAddress
  vote.uintVote = event.params.uintVote
  vote.proposal = event.params.proposalIndex.toString()
  vote.member = event.params.memberAddress.toHex()
  vote.save()

  let proposal = Proposal.load(event.params.proposalIndex.toString())
  if (event.params.uintVote == 1) {
    proposal.yesVotes = proposal.yesVotes.plus(BigInt.fromI32(1))
  }
  if (event.params.uintVote == 2) {
    proposal.noVotes = proposal.noVotes.plus(BigInt.fromI32(1))
  }

  let proposalVotes = proposal.votes
  proposalVotes.push(voteID)
  proposal.votes = proposalVotes
  proposal.save()

  let applicant = Applicant.load(proposal.applicant)
  let applicantVotes = applicant.votes
  applicantVotes.push(voteID)
  applicant.votes = applicantVotes
  applicant.save()
  
  let member = Member.load(event.params.memberAddress.toHex())
  let memberVotes = member.votes
  memberVotes.push(voteID)
  member.votes = memberVotes
  member.save()
}

export function handleProcessProposal(event: ProcessProposal): void {
  let proposal = Proposal.load(event.params.proposalIndex.toString())
  proposal.applicant = event.params.applicant.toHex()
  proposal.memberAddress = event.params.memberAddress
  proposal.tokenTribute = event.params.tokenTribute
  proposal.sharesRequested = event.params.sharesRequested
  proposal.didPass = event.params.didPass
  proposal.save()

  if (event.params.didPass) {
    let applicant = Applicant.load(event.params.applicant.toHex())
    applicant.didPass = true
    applicant.save()

    let member = Member.load(event.params.applicant.toHex())
    if (member == null) {
      let newMember = new Member(event.params.applicant.toHex())
      newMember.delegateKey = event.params.applicant
      newMember.shares = event.params.sharesRequested
      newMember.isActive = true
      newMember.tokenTribute = event.params.tokenTribute
      newMember.didRagequit = false
      member.votes = new Array<string>()
      member.submissions = new Array<string>()
      newMember.save()
    } else {
      member.shares = member.shares.plus(event.params.sharesRequested)
      member.tokenTribute = member.tokenTribute.plus(event.params.tokenTribute)
      member.save()
    }
    
  }
}

export function handleRagequit(event: Ragequit): void {
  let member = Member.load(event.params.memberAddress.toHex())
  member.didRagequit = true
  member.save()
}

export function handleAbort(event: Abort): void {
  let proposal = Proposal.load(event.params.proposalIndex.toString())
  proposal.aborted = true
  proposal.save()

  let applicant =  Applicant.load(event.params.applicantAddress.toHex())
  applicant.aborted = true
  applicant.save()
}

export function handleUpdateDelegateKey(event: UpdateDelegateKey): void {
  let member = Member.load(event.params.memberAddress.toHex())
  member.delegateKey = event.params.newDelegateKey
  member.save()
}
